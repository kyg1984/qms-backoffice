import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, FileText, History, Link2, Info,
  Plus, Trash2, Edit2, Check, X, Maximize2, ExternalLink,
  ChevronRight, Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import type { DocumentHistory } from '../types';

const DOC_TYPE_LABEL: Record<string, string> = { QI: '지침서', QP: '절차서', QM: '매뉴얼' };
const WEB_VIEW_EXTS = ['pdf', 'png', 'jpg', 'jpeg'];

type Tab = 'webview' | 'info' | 'history' | 'relations';

export const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    documents, setDocuments,
    documentFiles, setDocumentFiles,
    documentHistories, setDocumentHistories,
    documentRelations, setDocumentRelations,
    currentUser,
  } = useApp();

  const doc = documents.find(d => d.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('webview');
  const [fullscreen, setFullscreen] = useState(false);

  // New version upload modal
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVerRev, setNewVerRev] = useState('');
  const [newVerFile, setNewVerFile] = useState('');
  const [newVerExt, setNewVerExt] = useState('pdf');

  // Status change (reserved for future use)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  // History
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingHistory, setEditingHistory] = useState<DocumentHistory | null>(null);
  const [historyForm, setHistoryForm] = useState({ revision_date: '', rev_number: '', doc_name: '', doc_number: '', department: '', change_summary: '' });

  // Relations
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [relSearch, setRelSearch] = useState('');

  // Form (양식) upload
  const [showFormModal, setShowFormModal] = useState(false);
  const [formFileName, setFormFileName] = useState('');
  const [formFileExt, setFormFileExt] = useState('pdf');

  // Instruction (지침서) upload
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [instructionFileName, setInstructionFileName] = useState('');
  const [instructionFileExt, setInstructionFileExt] = useState('pdf');

  if (!doc) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">문서를 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/documents')} className="mt-4 text-blue-600 hover:underline text-sm">목록으로 돌아가기</button>
    </div>
  );

  const canWrite = currentUser.role !== 'VIEWER';
  const canDelete = currentUser.role === 'ADMIN';
  const currentFile = documentFiles.find(f => f.document_id === doc.id && f.is_current);
  const allFiles = documentFiles.filter(f => f.document_id === doc.id && f.file_category === 'form').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  const instructionFiles = documentFiles.filter(f => f.document_id === doc.id && f.file_category === 'instruction').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  const histories = documentHistories.filter(h => h.document_id === doc.id).sort((a, b) => a.revision_date.localeCompare(b.revision_date));

  // Related docs
  const relatedDocIds = documentRelations
    .filter(r => r.source_doc_id === doc.id || r.target_doc_id === doc.id)
    .map(r => r.source_doc_id === doc.id ? r.target_doc_id : r.source_doc_id);
  const relatedDocs = documents.filter(d => relatedDocIds.includes(d.id));

  const handleDownload = () => {
    if (!currentFile) return;
    alert(`다운로드: ${doc.doc_number}_${doc.doc_name}_${doc.current_rev}.${currentFile.file_ext}\n(목업 - 실제 파일 없음)`);
  };

  const confirmApprove = () => {
    setDocuments(documents.map(d => d.id === doc.id ? { ...d, status: 'APPROVED', updated_at: new Date().toISOString().slice(0, 10) } : d));
    setShowApproveConfirm(false);
  };

  const handleNewVersion = () => {
    if (!newVerRev || !newVerFile) { alert('Rev 번호와 파일을 입력하세요.'); return; }
    setDocumentFiles(documentFiles.map(f => f.document_id === doc.id ? { ...f, is_current: false } : f).concat({
      id: `f${Date.now()}`,
      document_id: doc.id,
      rev_number: newVerRev,
      file_path: `/files/${newVerFile}`,
      pdf_path: newVerExt === 'pdf' ? `/files/${newVerFile}` : null,
      file_ext: newVerExt,
      file_size: 120000,
      is_current: true,
      uploaded_by: currentUser.id,
      uploaded_at: new Date().toISOString().slice(0, 10),
    }));
    setDocuments(documents.map(d => d.id === doc.id ? { ...d, current_rev: newVerRev, status: 'REVIEW', updated_at: new Date().toISOString().slice(0, 10) } : d));
    setShowNewVersionModal(false);
    setNewVerRev('');
    setNewVerFile('');
  };

  const openHistoryCreate = () => {
    setEditingHistory(null);
    setHistoryForm({ revision_date: '', rev_number: doc.current_rev, doc_name: doc.doc_name, doc_number: doc.doc_number, department: doc.department, change_summary: '' });
    setShowHistoryModal(true);
  };

  const openHistoryEdit = (h: DocumentHistory) => {
    setEditingHistory(h);
    setHistoryForm({ revision_date: h.revision_date, rev_number: h.rev_number, doc_name: h.doc_name, doc_number: h.doc_number, department: h.department, change_summary: h.change_summary });
    setShowHistoryModal(true);
  };

  const saveHistory = () => {
    if (!historyForm.revision_date || !historyForm.rev_number || !historyForm.change_summary) { alert('필수 항목을 입력하세요.'); return; }
    if (editingHistory) {
      setDocumentHistories(documentHistories.map(h => h.id === editingHistory.id ? { ...h, ...historyForm, updated_by: currentUser.id, updated_at: new Date().toISOString() } : h));
    } else {
      setDocumentHistories([...documentHistories, {
        id: `h${Date.now()}`,
        document_id: doc.id,
        ...historyForm,
        recorded_by: currentUser.id,
        recorded_at: new Date().toISOString(),
      }]);
    }
    setShowHistoryModal(false);
  };

  const deleteHistory = (hid: string) => {
    if (!canDelete) return;
    if (confirm('이 변경이력을 삭제하시겠습니까?')) {
      setDocumentHistories(documentHistories.filter(h => h.id !== hid));
    }
  };

  const removeRelation = (targetDocId: string) => {
    setDocumentRelations(documentRelations.filter(r =>
      !(r.source_doc_id === doc.id && r.target_doc_id === targetDocId) &&
      !(r.target_doc_id === doc.id && r.source_doc_id === targetDocId)
    ));
  };

  const handleFormUpload = () => {
    if (!formFileName) { alert('파일을 선택하세요.'); return; }
    setDocumentFiles([...documentFiles, {
      id: `f${Date.now()}`,
      document_id: doc.id,
      rev_number: doc.current_rev,
      file_path: `/files/${formFileName}`,
      pdf_path: formFileExt === 'pdf' ? `/files/${formFileName}` : null,
      file_ext: formFileExt,
      file_size: 80000,
      is_current: false,
      uploaded_by: currentUser.id,
      uploaded_at: new Date().toISOString().slice(0, 10),
      file_category: 'form',
    }]);
    setShowFormModal(false);
    setFormFileName('');
  };

  const handleInstructionUpload = () => {
    if (!instructionFileName) { alert('파일을 선택하세요.'); return; }
    setDocumentFiles([...documentFiles, {
      id: `f${Date.now()}`,
      document_id: doc.id,
      rev_number: doc.current_rev,
      file_path: `/files/${instructionFileName}`,
      pdf_path: instructionFileExt === 'pdf' ? `/files/${instructionFileName}` : null,
      file_ext: instructionFileExt,
      file_size: 80000,
      is_current: false,
      uploaded_by: currentUser.id,
      uploaded_at: new Date().toISOString().slice(0, 10),
      file_category: 'instruction',
    }]);
    setShowInstructionModal(false);
    setInstructionFileName('');
  };

  const addRelation = (targetDocId: string) => {
    if (relatedDocIds.includes(targetDocId)) return;
    setDocumentRelations([...documentRelations, {
      id: `r${Date.now()}`,
      source_doc_id: doc.id,
      target_doc_id: targetDocId,
      created_by: currentUser.id,
      created_at: new Date().toISOString().slice(0, 10),
    }]);
    setShowRelationModal(false);
    setRelSearch('');
  };

  const webViewSupported = currentFile && WEB_VIEW_EXTS.includes(currentFile.file_ext);
  const isPdfViewable = currentFile && (currentFile.file_ext === 'pdf' || currentFile.pdf_path);
  const isConverting = currentFile?.file_ext === 'docx' && !currentFile.pdf_path;

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'webview', label: '웹뷰', icon: FileText },
    { key: 'info', label: '상세 정보', icon: Info },
    { key: 'history', label: `변경이력 (${histories.length})`, icon: History },
    { key: 'relations', label: `연관 문서 (${relatedDocs.length})`, icon: Link2 },
  ];

  const relSearchResults = documents.filter(d =>
    d.id !== doc.id &&
    !relatedDocIds.includes(d.id) &&
    (relSearch ? d.doc_number.toLowerCase().includes(relSearch.toLowerCase()) || d.doc_name.toLowerCase().includes(relSearch.toLowerCase()) : true)
  ).slice(0, 6);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/documents')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft size={16} /> 문서 목록
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-lg font-bold text-blue-600">{doc.doc_number}</span>
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium">{DOC_TYPE_LABEL[doc.doc_type]}</span>
              <StatusBadge status={doc.status} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{doc.doc_name}</h1>
            <p className="text-sm text-gray-500 mt-1">{doc.department} · {doc.current_rev} · 최종 수정: {doc.updated_at}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {canWrite && doc.status !== 'APPROVED' && (
              <button
                disabled
                className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                title="검토 중인 문서는 다음 절차를 진행할 수 없습니다"
              >
                승인으로 변경
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={doc.status !== 'APPROVED'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${doc.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              title={doc.status !== 'APPROVED' ? '승인된 문서만 다운로드 가능합니다' : undefined}
            >
              <Download size={15} /> 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'webview' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">
                {currentFile ? `${doc.doc_name} · ${doc.current_rev}.${currentFile.file_ext}` : '파일 없음'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFullscreen(true)} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors" title="전체화면"><Maximize2 size={15} /></button>
              <button onClick={handleDownload} disabled={doc.status !== 'APPROVED'} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${doc.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} title={doc.status !== 'APPROVED' ? '승인된 문서만 다운로드 가능합니다' : undefined}><Download size={13} />다운로드</button>
            </div>
          </div>
          <div className="min-h-96 flex items-center justify-center bg-gray-100">
            {!currentFile ? (
              <div className="text-center text-gray-400">
                <FileText size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">등록된 파일이 없습니다.</p>
              </div>
            ) : isConverting ? (
              <div className="text-center text-gray-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">변환 중...</p>
                <p className="text-xs text-gray-400 mt-1">Word 파일을 PDF로 변환하고 있습니다.</p>
              </div>
            ) : !webViewSupported ? (
              <div className="text-center text-gray-500 p-8">
                <FileText size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">.{currentFile.file_ext} 형식은 웹뷰를 지원하지 않습니다.</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">파일을 다운로드하여 열람하세요.</p>
                <button onClick={handleDownload} disabled={doc.status !== 'APPROVED'} className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-sm transition-colors ${doc.status === 'APPROVED' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`} title={doc.status !== 'APPROVED' ? '승인된 문서만 다운로드 가능합니다' : undefined}>
                  <Download size={15} /> 다운로드
                </button>
              </div>
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-white border border-gray-200 m-4 rounded-lg">
                <div className="text-center text-gray-400">
                  <div className="w-16 h-20 bg-red-50 border border-red-200 rounded flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-500 font-bold text-lg uppercase">{currentFile.file_ext}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{isPdfViewable ? 'PDF 뷰어 영역' : '뷰어'}</p>
                  <p className="text-xs text-gray-400 mt-1">실제 환경에서는 여기에 문서가 표시됩니다</p>
                  <p className="text-xs text-gray-300 mt-0.5 font-mono">{currentFile.file_path}</p>
                </div>
              </div>
            )}
          </div>

          {/* 웹뷰 업로드 섹션 */}
          {canWrite && (
            <div className="border-t border-gray-200 px-4 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">문서 파일 업로드</p>
                  <p className="text-xs text-gray-400 mt-0.5">새 파일을 업로드하면 현재 버전이 교체됩니다. 모든 형식 지원.</p>
                </div>
                <button
                  onClick={() => setShowNewVersionModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={14} /> 파일 업로드
                </button>
              </div>
              {currentFile && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 text-sm">
                  <FileText size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 font-medium">{currentFile.file_path.split('/').pop()}</span>
                  <span className="text-gray-400 text-xs">.{currentFile.file_ext} · {(currentFile.file_size / 1024).toFixed(0)}KB · {currentFile.uploaded_at}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">문서 기본 정보</h3>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              {[
                ['문서번호', doc.doc_number],
                ['문서명', doc.doc_name],
                ['문서 구분', DOC_TYPE_LABEL[doc.doc_type]],
                ['담당부서', doc.department],
                ['현재 Rev', doc.current_rev],
                ['등록일', doc.created_at],
                ['최종 수정일', doc.updated_at],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium">{value}</dd>
                </div>
              ))}
              <div>
                <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">상태</dt>
                <dd className="mt-1"><StatusBadge status={doc.status} /></dd>
              </div>
            </dl>
          </div>

          {/* 지침서 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">지침서</h3>
              {canWrite && (
                <button onClick={() => setShowInstructionModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={14} /> 지침서 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {instructionFiles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">등록된 지침서가 없습니다.</p>
              ) : (
                instructionFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText size={15} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{f.file_path.split('/').pop()}</span>
                      <span className="text-xs text-gray-400">.{f.file_ext} · {(f.file_size / 1024).toFixed(0)}KB</span>
                      <span className="text-xs text-gray-400">{f.uploaded_at}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`다운로드: ${f.file_path.split('/').pop()}\n(목업 - 실제 파일 없음)`)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Download size={13} /> 다운로드
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDocumentFiles(documentFiles.filter(df => df.id !== f.id))}
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 양식 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">양식</h3>
              {canWrite && (
                <button onClick={() => setShowFormModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={14} /> 양식 추가
                </button>
              )}
            </div>
            <div className="space-y-2">
              {allFiles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">등록된 양식이 없습니다.</p>
              ) : (
                allFiles.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <FileText size={15} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{f.file_path.split('/').pop()}</span>
                      <span className="text-xs text-gray-400">.{f.file_ext} · {(f.file_size / 1024).toFixed(0)}KB</span>
                      <span className="text-xs text-gray-400">{f.uploaded_at}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`다운로드: ${f.file_path.split('/').pop()}\n(목업 - 실제 파일 없음)`)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Download size={13} /> 다운로드
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => setDocumentFiles(documentFiles.filter(df => df.id !== f.id))}
                          className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">변경이력</h3>
            {canWrite && (
              <button onClick={openHistoryCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={14} /> 이력 추가
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {['날짜', 'Rev', '문서명', '문서번호', '담당부서', '변경 내용', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {histories.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">등록된 변경이력이 없습니다.</td></tr>
                ) : (
                  histories.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{h.revision_date}</td>
                      <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">{h.rev_number}</td>
                      <td className="px-4 py-3 text-gray-700">{h.doc_name}</td>
                      <td className="px-4 py-3 font-mono text-blue-600">{h.doc_number}</td>
                      <td className="px-4 py-3 text-gray-600">{h.department}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs">{h.change_summary}</td>
                      <td className="px-4 py-3">
                        {canWrite && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => openHistoryEdit(h)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"><Edit2 size={13} /></button>
                            {canDelete && <button onClick={() => deleteHistory(h.id)} className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'relations' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">연관 문서</h3>
            {canWrite && (
              <button onClick={() => setShowRelationModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Plus size={14} /> 연관 문서 추가
              </button>
            )}
          </div>
          <div className="p-6">
            {relatedDocs.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Link2 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">등록된 연관 문서가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {relatedDocs.map(rd => (
                  <div key={rd.id} className="flex items-center justify-between p-3.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-blue-600">{rd.doc_number}</span>
                      <span className="text-sm text-gray-800">{rd.doc_name}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{DOC_TYPE_LABEL[rd.doc_type]}</span>
                      <StatusBadge status={rd.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/documents/${rd.id}`)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="문서 이동">
                        <ExternalLink size={14} />
                      </button>
                      {canWrite && (
                        <button onClick={() => removeRelation(rd.id)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50">
                          <X size={12} /> 해제
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <span className="text-white text-sm">{doc.doc_number} - {doc.doc_name}</span>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"><Download size={13} />다운로드</button>
              <button onClick={() => setFullscreen(false)} className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"><X size={16} /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <p className="text-sm">전체화면 뷰어 영역</p>
              <p className="text-xs mt-1 opacity-60">실제 환경에서는 여기에 PDF 뷰어가 표시됩니다</p>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirm Modal */}
      <Modal isOpen={showApproveConfirm} onClose={() => setShowApproveConfirm(false)} title="문서 승인" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={doc.status} />
            <ChevronRight size={16} className="text-gray-400" />
            <StatusBadge status="APPROVED" />
          </div>
          <p className="text-sm text-gray-600">문서를 승인하시겠습니까? 승인 후에는 되돌릴 수 없습니다.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowApproveConfirm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={confirmApprove} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"><Check size={14} />승인</button>
          </div>
        </div>
      </Modal>

      {/* New Version Modal */}
      <Modal isOpen={showNewVersionModal} onClose={() => setShowNewVersionModal(false)} title="새 버전 등록" size="md">
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            새 버전 등록 시 문서 상태가 <strong>검토</strong>로 초기화됩니다.
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <div><span className="font-medium">문서번호:</span> {doc.doc_number}</div>
            <div><span className="font-medium">현재 Rev:</span> {doc.current_rev}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 Rev 번호 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newVerRev}
              onChange={e => setNewVerRev(e.target.value)}
              placeholder="예: Rev.03"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              {newVerFile ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{newVerFile}</span>
                  <button onClick={() => setNewVerFile('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-sm text-gray-500">파일을 선택하세요</p>
                  <input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setNewVerFile(file.name); setNewVerExt(file.name.split('.').pop() ?? 'pdf'); }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowNewVersionModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleNewVersion} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">등록</button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={editingHistory ? '변경이력 수정' : '변경이력 추가'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">변경 날짜 <span className="text-red-500">*</span></label>
              <input type="date" value={historyForm.revision_date} onChange={e => setHistoryForm(f => ({ ...f, revision_date: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rev 번호 <span className="text-red-500">*</span></label>
              <input type="text" value={historyForm.rev_number} onChange={e => setHistoryForm(f => ({ ...f, rev_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서명 <span className="text-red-500">*</span></label>
              <input type="text" value={historyForm.doc_name} onChange={e => setHistoryForm(f => ({ ...f, doc_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서번호 <span className="text-red-500">*</span></label>
              <input type="text" value={historyForm.doc_number} onChange={e => setHistoryForm(f => ({ ...f, doc_number: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당부서 <span className="text-red-500">*</span></label>
            <input type="text" value={historyForm.department} onChange={e => setHistoryForm(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">변경 내용 <span className="text-red-500">*</span></label>
            <textarea value={historyForm.change_summary} onChange={e => setHistoryForm(f => ({ ...f, change_summary: e.target.value }))} rows={3} placeholder="변경 내용을 입력하세요" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={saveHistory} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">저장</button>
          </div>
        </div>
      </Modal>

      {/* Form (양식) Upload Modal */}
      <Modal isOpen={showFormModal} onClose={() => { setShowFormModal(false); setFormFileName(''); }} title="양식 추가" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              {formFileName ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{formFileName}</span>
                  <button onClick={() => setFormFileName('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-sm text-gray-500">파일을 선택하세요</p>
                  <p className="text-xs text-gray-400 mt-1">모든 파일 형식 지원</p>
                  <input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setFormFileName(file.name); setFormFileExt(file.name.split('.').pop() ?? 'pdf'); }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowFormModal(false); setFormFileName(''); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleFormUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">추가</button>
          </div>
        </div>
      </Modal>

      {/* Instruction (지침서) Upload Modal */}
      <Modal isOpen={showInstructionModal} onClose={() => { setShowInstructionModal(false); setInstructionFileName(''); }} title="지침서 추가" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일 첨부 <span className="text-red-500">*</span></label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              {instructionFileName ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{instructionFileName}</span>
                  <button onClick={() => setInstructionFileName('')} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-sm text-gray-500">파일을 선택하세요</p>
                  <p className="text-xs text-gray-400 mt-1">모든 파일 형식 지원</p>
                  <input
                    type="file"
                    accept="*/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setInstructionFileName(file.name); setInstructionFileExt(file.name.split('.').pop() ?? 'pdf'); }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowInstructionModal(false); setInstructionFileName(''); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleInstructionUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">추가</button>
          </div>
        </div>
      </Modal>

      {/* Relation Search Modal */}
      <Modal isOpen={showRelationModal} onClose={() => { setShowRelationModal(false); setRelSearch(''); }} title="연관 문서 추가" size="md">
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={relSearch}
              onChange={e => setRelSearch(e.target.value)}
              placeholder="문서번호 또는 문서명 검색"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {relSearchResults.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">검색 결과가 없습니다.</p>
            ) : (
              relSearchResults.map(d => (
                <button
                  key={d.id}
                  onClick={() => addRelation(d.id)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-blue-600">{d.doc_number}</span>
                    <span className="text-sm text-gray-700">{d.doc_name}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{DOC_TYPE_LABEL[d.doc_type]}</span>
                  </div>
                  <Plus size={14} className="text-blue-500 flex-shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
