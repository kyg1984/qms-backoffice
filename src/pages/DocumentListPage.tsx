import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, X, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import type { DocType, DocStatus, Document } from '../types';
import { toDateStr } from '../utils/date';
import { documentService } from '../services/documentService';
import { fileService } from '../services/fileService';
import { historyService } from '../services/historyService';
import { relationService } from '../services/relationService';
import { MAX_FILE_SIZE_BYTES } from '../config/fileTypes';

const DOC_TYPE_LABEL: Record<DocType, string> = { QI: '지침서', QP: '절차서', QM: '매뉴얼' };

type SortKey = 'doc_number' | 'doc_name' | 'doc_type' | 'department' | 'current_rev' | 'status' | 'updated_at';
type SortDir = 'asc' | 'desc';

const INITIAL_FORM = {
  doc_number: '',
  doc_name: '',
  doc_type: 'QP' as DocType,
  department: '',
  current_rev: '',
  revised_at: '',
  fileName: '',
  fileExt: 'pdf',
};

export const DocumentListPage = () => {
  const navigate = useNavigate();
  const { documents, setDocuments, documentFiles, setDocumentFiles, documentHistories, setDocumentHistories, documentRelations, setDocumentRelations, currentUser, departments } = useApp();

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<DocType[]>([]);
  const [filterStatus, setFilterStatus] = useState<DocStatus[]>([]);
  const [filterHasInstruction, setFilterHasInstruction] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState(INITIAL_FORM);
  const [docNumberSuffix, setDocNumberSuffix] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);

  const nextQmNumber = useMemo(() => {
    const max = documents
      .filter(d => d.doc_type === 'QM')
      .reduce((acc, d) => {
        const m = d.doc_number.match(/QM-(\d+)/);
        return m ? Math.max(acc, parseInt(m[1])) : acc;
      }, 0);
    return `QM-${String(max + 1).padStart(3, '0')}`;
  }, [documents]);

  const canWrite = currentUser.role !== 'VIEWER';
  const canDelete = currentUser.role === 'ADMIN' || currentUser.role === 'AUTHOR';

  const filtered = useMemo(() => {
    return documents.filter(d => {
      if (keyword && !d.doc_number.toLowerCase().includes(keyword.toLowerCase()) && !d.doc_name.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (filterType.length && !filterType.includes(d.doc_type)) return false;
      if (filterStatus.length && !filterStatus.includes(d.status)) return false;
      if (filterHasInstruction && !documentFiles.some(f => f.document_id === d.id && f.file_category === 'instruction')) return false;
      if (filterDept && d.department !== filterDept) return false;
      if (dateFrom && d.updated_at < dateFrom) return false;
      if (dateTo && d.updated_at > dateTo) return false;
      return true;
    }).sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return sortDir === 'asc' ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
    });
  }, [documents, documentFiles, keyword, filterType, filterStatus, filterHasInstruction, filterDept, dateFrom, dateTo, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronsUpDown size={14} className="text-gray-400" />;
    return sortDir === 'asc' ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-blue-500" />;
  };

  const toggleFilter = <T,>(arr: T[], setArr: (a: T[]) => void, val: T) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const handleUpload = async () => {
    setUploadError('');
    const composedDocNumber = uploadForm.doc_type === 'QM'
      ? nextQmNumber
      : `QP-${docNumberSuffix.trim()}`;
    const trimmedForm = { ...uploadForm, doc_number: composedDocNumber, department: uploadForm.department.trim() };
    setUploadForm(trimmedForm);
    if (!composedDocNumber || (uploadForm.doc_type === 'QP' && !docNumberSuffix.trim())) {
      setUploadError('문서번호를 입력하세요.');
      return;
    }
    if (!trimmedForm.doc_name || !trimmedForm.department || !trimmedForm.fileName) {
      setUploadError('모든 필수 항목을 입력하세요.');
      return;
    }
    if (!trimmedForm.current_rev.trim()) {
      setUploadError('Rev를 입력하세요.');
      return;
    }
    if (documents.some(d => d.doc_number === composedDocNumber)) {
      setUploadError('이미 존재하는 문서번호입니다.');
      return;
    }
    try {
      const docId = `d${Date.now()}`;
      let filePath = `/files/${trimmedForm.fileName}`;
      if (uploadFileObj) {
        const storagePath = `documents/${docId}/${Date.now()}_${trimmedForm.fileName}`;
        filePath = await fileService.uploadFile(storagePath, uploadFileObj);
      }
      const newDoc = {
        id: docId,
        doc_number: trimmedForm.doc_number,
        doc_name: trimmedForm.doc_name,
        doc_type: trimmedForm.doc_type,
        department: trimmedForm.department,
        status: 'REVIEW' as const,
        current_rev: trimmedForm.current_rev,
        created_by: currentUser.id,
        created_at: toDateStr(),
        updated_at: trimmedForm.revised_at.trim() || toDateStr(),
      };
      await documentService.create(newDoc);
      const newFile = {
        id: `f${Date.now()}`,
        document_id: docId,
        rev_number: trimmedForm.current_rev,
        file_path: filePath,
        pdf_path: trimmedForm.fileExt === 'pdf' ? filePath : null,
        file_ext: trimmedForm.fileExt,
        file_size: uploadFileObj?.size ?? 100000,
        is_current: true,
        uploaded_by: currentUser.id,
        uploaded_at: toDateStr(),
      };
      await fileService.create(newFile);
      const sorted = [...documents, newDoc].sort((a, b) => a.doc_number.localeCompare(b.doc_number));
      setDocuments(sorted);
      setSortKey('doc_number');
      setSortDir('asc');
      setDocumentFiles([...documentFiles, newFile]);
      setShowUploadModal(false);
      setUploadForm(INITIAL_FORM);
      setDocNumberSuffix('');
      setUploadFileObj(null);
    } catch {
      setUploadError('문서 등록 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.');
    }
  };

  const handleDelete = async (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    if (!window.confirm(`"${doc.doc_number} ${doc.doc_name}" 문서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      // Delete related files from storage and DB
      const relatedFiles = documentFiles.filter(f => f.document_id === doc.id);
      for (const f of relatedFiles) {
        if (f.file_path.includes('supabase')) await fileService.deleteFromStorage(f.file_path);
        await fileService.delete(f.id);
      }
      // Delete histories
      const relatedHistories = documentHistories.filter(h => h.document_id === doc.id);
      for (const h of relatedHistories) {
        await historyService.delete(h.id);
      }
      // Delete relations
      const relatedRels = documentRelations.filter(r => r.source_doc_id === doc.id || r.target_doc_id === doc.id);
      for (const r of relatedRels) {
        await relationService.delete(r.id);
      }
      await documentService.delete(doc.id);
      setDocuments(documents.filter(d => d.id !== doc.id));
      setDocumentFiles(documentFiles.filter(f => f.document_id !== doc.id));
      setDocumentHistories(documentHistories.filter(h => h.document_id !== doc.id));
      setDocumentRelations(documentRelations.filter(r => r.source_doc_id !== doc.id && r.target_doc_id !== doc.id));
    } catch {
      alert('문서 삭제 중 오류가 발생했습니다.');
    }
  };

  const hasFilters = keyword || filterType.length || filterStatus.length || filterHasInstruction || filterDept || dateFrom || dateTo;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">문서 목록</h1>
          <p className="text-sm text-gray-500 mt-0.5">총 {filtered.length}건의 문서</p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            문서 등록
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        <div className="flex gap-3 flex-wrap items-end">
          <div className="relative flex-1 min-w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="문서번호 또는 문서명 검색"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 부서</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="flex gap-2 items-center">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-gray-400 text-sm">~</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {hasFilters && (
            <button onClick={() => { setKeyword(''); setFilterType([]); setFilterStatus([]); setFilterHasInstruction(false); setFilterDept(''); setDateFrom(''); setDateTo(''); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors">
              <X size={14} /> 초기화
            </button>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">구분</span>
            {(['QP', 'QM'] as DocType[]).map(t => (
              <button
                key={t}
                onClick={() => toggleFilter(filterType, setFilterType, t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterType.includes(t) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}
              >
                {DOC_TYPE_LABEL[t]}
              </button>
            ))}
            <span className="text-gray-200 text-xs">|</span>
            <button
              onClick={() => setFilterHasInstruction(v => !v)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterHasInstruction ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'}`}
            >
              지침서 포함
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">상태</span>
            {([['REVIEW', '검토'], ['APPROVED', '승인']] as [DocStatus, string][]).map(([s, l]) => (
              <button
                key={s}
                onClick={() => toggleFilter(filterStatus, setFilterStatus, s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${filterStatus.includes(s) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {([
                  ['doc_number', '문서번호'],
                  ['doc_name', '문서명'],
                  ['doc_type', '구분'],
                  ['department', '담당부서'],
                  ['current_rev', 'Rev'],
                  ['status', '상태'],
                  ['updated_at', '개정일자'],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <span className="flex items-center gap-1">{label}<SortIcon k={key} /></span>
                  </th>
                ))}
                {canDelete && <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">삭제</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="px-4 py-12 text-center text-gray-400">검색 결과가 없습니다.</td>
                </tr>
              ) : (
                filtered.map(doc => (
                  <tr
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-semibold text-blue-600">{doc.doc_number}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-900">{doc.doc_name}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{DOC_TYPE_LABEL[doc.doc_type]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{doc.department}</td>
                    <td className="px-4 py-3.5 font-mono text-gray-700">{doc.current_rev}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3.5 text-gray-500">{doc.updated_at}</td>
                    {canDelete && (
                      <td className="px-4 py-3.5">
                        <button
                          onClick={e => handleDelete(e, doc)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          title="문서 삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => { setShowUploadModal(false); setUploadError(''); setUploadForm(INITIAL_FORM); setDocNumberSuffix(''); setUploadFileObj(null); }} title="신규 문서 등록" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서 구분 <span className="text-red-500">*</span></label>
              <select
                value={uploadForm.doc_type}
                onChange={e => {
                  setUploadForm(f => ({ ...f, doc_type: e.target.value as DocType }));
                  setDocNumberSuffix('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="QP">절차서 (QP)</option>
                <option value="QM">매뉴얼 (QM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서번호 <span className="text-red-500">*</span></label>
              {uploadForm.doc_type === 'QP' ? (
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="px-3 py-2 bg-gray-100 text-sm text-gray-500 border-r border-gray-300 select-none">QP-</span>
                  <input
                    type="text"
                    value={docNumberSuffix}
                    onChange={e => setDocNumberSuffix(e.target.value.replace(/\D/g, ''))}
                    placeholder="숫자 입력"
                    className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={nextQmNumber}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문서명 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={uploadForm.doc_name}
              onChange={e => setUploadForm(f => ({ ...f, doc_name: e.target.value }))}
              placeholder="문서명을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당부서 <span className="text-red-500">*</span></label>
              <select
                value={uploadForm.department}
                onChange={e => setUploadForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rev <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={uploadForm.current_rev}
                onChange={e => setUploadForm(f => ({ ...f, current_rev: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">개정일자</label>
            <input
              type="date"
              value={uploadForm.revised_at}
              onChange={e => setUploadForm(f => ({ ...f, revised_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">미입력 시 오늘 날짜로 자동 설정됩니다.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              {uploadForm.fileName ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{uploadForm.fileName}</span>
                  <button onClick={() => { setUploadForm(f => ({ ...f, fileName: '', fileExt: 'pdf' })); setUploadFileObj(null); }} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-sm text-gray-500">파일을 선택하거나 드래그하세요</p>
                  <p className="text-xs text-gray-400 mt-1">모든 파일 형식 지원 (최대 300MB)</p>
                  <input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > MAX_FILE_SIZE_BYTES) { alert(`파일 크기는 ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB 이하여야 합니다.`); return; }
                        const ext = file.name.split('.').pop() ?? 'pdf';
                        setUploadForm(f => ({ ...f, fileName: file.name, fileExt: ext }));
                        setUploadFileObj(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowUploadModal(false); setUploadError(''); setUploadForm(INITIAL_FORM); setDocNumberSuffix(''); setUploadFileObj(null); }} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">등록</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
