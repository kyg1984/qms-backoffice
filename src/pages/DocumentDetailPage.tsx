import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, FileText, History, Link2, Info,
  Plus, Trash2, Edit2, X, ExternalLink, Search,
  Folder, FolderOpen, FolderPlus, ChevronRight, ChevronDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import type { DocumentHistory } from '../types';
import { toDateStr } from '../utils/date';
import { documentService } from '../services/documentService';
import { fileService } from '../services/fileService';
import { historyService } from '../services/historyService';
import { relationService } from '../services/relationService';

const DOC_TYPE_LABEL: Record<string, string> = { QI: '지침서', QP: '절차서', QM: '매뉴얼' };

type Tab = 'webview' | 'info' | 'history' | 'relations';

interface FolderItem {
  id: string;
  name: string;
  doc_number: string;
  doc_name: string;
  department: string;
}

const EMPTY_FOLDER: Omit<FolderItem, 'id'> = { name: '', doc_number: '', doc_name: '', department: '' };

export const DocumentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    documents, setDocuments,
    documentFiles, setDocumentFiles,
    documentHistories, setDocumentHistories,
    documentRelations, setDocumentRelations,
    currentUser,
    departments,
  } = useApp();

  const doc = documents.find(d => d.id === id);
  const [activeTab, setActiveTab] = useState<Tab>('webview');

  // New version upload modal
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVerRev, setNewVerRev] = useState('');
  const [newVerFile, setNewVerFile] = useState('');
  const [newVerExt, setNewVerExt] = useState('pdf');

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
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formDocName, setFormDocName] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formFolder, setFormFolder] = useState('');

  // Folder management (양식)
  const [formFolders, setFormFolders] = useState<FolderItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolder, setNewFolder] = useState<Omit<FolderItem, 'id'>>({ ...EMPTY_FOLDER });

  const [newVerFileObj, setNewVerFileObj] = useState<File | null>(null);
  const [formFileObj, setFormFileObj] = useState<File | null>(null);
  const [instructionFileObj, setInstructionFileObj] = useState<File | null>(null);

  // Instruction (지침서) upload
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [instructionFileName, setInstructionFileName] = useState('');
  const [instructionFileExt, setInstructionFileExt] = useState('pdf');
  const [instructionDocNumber, setInstructionDocNumber] = useState('');
  const [instructionDocName, setInstructionDocName] = useState('');
  const [instructionRev, setInstructionRev] = useState('');
  const [instructionUploadDate, setInstructionUploadDate] = useState('');

  if (!doc) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">문서를 찾을 수 없습니다.</p>
      <button onClick={() => navigate('/documents')} className="mt-4 text-blue-600 hover:underline text-sm">목록으로 돌아가기</button>
    </div>
  );

  const canWrite = currentUser.role !== 'VIEWER';
  const canApprove = currentUser.role === 'ADMIN' || currentUser.role === 'AUTHOR';
  const canDelete = currentUser.role === 'ADMIN';
  // 양식 업로드: ADMIN, AUTHOR, 폴더 담당부서 / 삭제: 동일
  const isAdminOrAuthor = currentUser.role === 'ADMIN' || currentUser.role === 'AUTHOR';
  const canUploadToFolder = (folderName: string) => {
    if (isAdminOrAuthor) return true;
    const folder = formFolders.find(f => f.name === folderName);
    return !!folder && currentUser.department === folder.department;
  };
  const canUploadForm = isAdminOrAuthor || formFolders.some(f => currentUser.department === f.department);
  const canDeleteForm = isAdminOrAuthor || formFolders.some(f => currentUser.department === f.department);

  const handleApprove = async () => {
    if (!window.confirm('승인으로 변경하시겠습니까?')) return;
    const updated = { status: 'APPROVED' as const, updated_at: toDateStr() };
    try {
      await documentService.update(doc.id, updated);
      setDocuments(documents.map(d => d.id === doc.id ? { ...d, ...updated } : d));
    } catch { alert('상태 변경 중 오류가 발생했습니다.'); }
  };
  const currentFile = documentFiles.find(f => f.document_id === doc.id && f.is_current);
  const allFiles = documentFiles.filter(f => f.document_id === doc.id && f.file_category === 'form').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  // orphan folders from files (no FolderItem metadata)
  const orphanFolderNames = [...new Set(allFiles.map(f => f.form_folder).filter(Boolean) as string[])].filter(n => !formFolders.find(f => f.name === n));
  const allFolderItems: FolderItem[] = [...formFolders, ...orphanFolderNames.map(n => ({ id: n, name: n, doc_number: '', doc_name: n, department: '' }))];
  const allFolderNames = allFolderItems.map(f => f.name);
  const unfoldered = allFiles.filter(f => !f.form_folder);
  const instructionFiles = documentFiles.filter(f => f.document_id === doc.id && f.file_category === 'instruction').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  const histories = documentHistories.filter(h => h.document_id === doc.id).sort((a, b) => a.revision_date.localeCompare(b.revision_date));

  // Related docs
  const relatedDocIds = documentRelations
    .filter(r => r.source_doc_id === doc.id || r.target_doc_id === doc.id)
    .map(r => r.source_doc_id === doc.id ? r.target_doc_id : r.source_doc_id);
  const relatedDocs = documents.filter(d => relatedDocIds.includes(d.id));

  const handleDownload = async () => {
    if (!currentFile) return;
    try {
      if (currentFile.file_path.includes('supabase')) {
        const url = await fileService.getSignedUrl(currentFile.file_path);
        window.open(url, '_blank');
      } else {
        alert(`다운로드: ${doc.doc_number}_${doc.doc_name}_${doc.current_rev}.${currentFile.file_ext}`);
      }
    } catch { alert('파일 다운로드 중 오류가 발생했습니다.'); }
  };

  const handleOpenFile = async (file: typeof currentFile) => {
    if (!file) return;
    try {
      if (file.file_path.includes('supabase')) {
        const url = await fileService.getSignedUrl(file.file_path);
        window.open(url, '_blank');
      } else {
        alert('업로드된 파일만 열기가 가능합니다.');
      }
    } catch { alert('파일을 열 수 없습니다.'); }
  };

  const handleNewVersion = async () => {
    if (!newVerRev || !newVerFile) { alert('Rev 번호와 파일을 입력하세요.'); return; }
    try {
      let filePath = `/files/${newVerFile}`;
      if (newVerFileObj) {
        filePath = await fileService.uploadFile(`documents/${doc.id}/`, newVerFileObj);
      }
      // Mark old files as not current
      const currentFiles = documentFiles.filter(f => f.document_id === doc.id && f.is_current);
      for (const cf of currentFiles) {
        await fileService.update(cf.id, { is_current: false });
      }
      const newFile = {
        id: `f${Date.now()}`,
        document_id: doc.id,
        rev_number: newVerRev,
        file_path: filePath,
        pdf_path: newVerExt === 'pdf' ? filePath : null,
        file_ext: newVerExt,
        file_size: newVerFileObj?.size ?? 120000,
        is_current: true,
        uploaded_by: currentUser.id,
        uploaded_at: toDateStr(),
        original_name: newVerFile,
      };
      await fileService.create(newFile);
      const docUpdates = { current_rev: newVerRev, status: 'REVIEW' as const, updated_at: toDateStr() };
      await documentService.update(doc.id, docUpdates);
      setDocumentFiles(documentFiles.map(f => f.document_id === doc.id ? { ...f, is_current: false } : f).concat(newFile));
      setDocuments(documents.map(d => d.id === doc.id ? { ...d, ...docUpdates } : d));
      setShowNewVersionModal(false);
      setNewVerRev('');
      setNewVerFile('');
      setNewVerFileObj(null);
    } catch { alert('새 버전 업로드 중 오류가 발생했습니다.'); }
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

  const saveHistory = async () => {
    if (!historyForm.revision_date || !historyForm.rev_number || !historyForm.change_summary) { alert('필수 항목을 입력하세요.'); return; }
    try {
      if (editingHistory) {
        const updates = { ...historyForm, updated_by: currentUser.id, updated_at: new Date().toISOString() };
        await historyService.update(editingHistory.id, updates);
        setDocumentHistories(documentHistories.map(h => h.id === editingHistory.id ? { ...h, ...updates } : h));
      } else {
        const newH = {
          id: `h${Date.now()}`,
          document_id: doc.id,
          ...historyForm,
          recorded_by: currentUser.id,
          recorded_at: new Date().toISOString(),
        };
        await historyService.create(newH);
        setDocumentHistories([...documentHistories, newH]);
      }
      setShowHistoryModal(false);
    } catch { alert('변경이력 저장 중 오류가 발생했습니다.'); }
  };

  const deleteHistory = async (hid: string) => {
    if (!canDelete) return;
    if (confirm('이 변경이력을 삭제하시겠습니까?')) {
      try {
        await historyService.delete(hid);
        setDocumentHistories(documentHistories.filter(h => h.id !== hid));
      } catch { alert('변경이력 삭제 중 오류가 발생했습니다.'); }
    }
  };

  const removeRelation = async (targetDocId: string) => {
    const rel = documentRelations.find(r =>
      (r.source_doc_id === doc.id && r.target_doc_id === targetDocId) ||
      (r.target_doc_id === doc.id && r.source_doc_id === targetDocId)
    );
    if (!rel) return;
    try {
      await relationService.delete(rel.id);
      setDocumentRelations(documentRelations.filter(r => r.id !== rel.id));
    } catch { alert('연관 문서 삭제 중 오류가 발생했습니다.'); }
  };

  const resetFormModal = () => { setShowFormModal(false); setFormFileName(''); setFormDocNumber(''); setFormDocName(''); setFormDepartment(''); setFormFolder(''); setFormFileObj(null); };
  const handleFormUpload = async () => {
    if (!formFolder.trim()) { alert('폴더를 선택하세요.'); return; }
    if (!canUploadToFolder(formFolder.trim())) { alert('해당 폴더에 업로드 권한이 없습니다.'); return; }
    if (!formDocNumber.trim()) { alert('문서번호를 입력하세요.'); return; }
    if (!formDocName.trim()) { alert('문서명을 입력하세요.'); return; }
    if (!formFileName) { alert('파일을 선택하세요.'); return; }
    try {
      let filePath = `/files/${formFileName}`;
      if (formFileObj) {
        filePath = await fileService.uploadFile(`forms/${doc.id}/${formFolder.trim()}/`, formFileObj);
      }
      const newFile = {
        id: `f${Date.now()}`,
        document_id: doc.id,
        rev_number: doc.current_rev,
        file_path: filePath,
        pdf_path: formFileExt === 'pdf' ? filePath : null,
        file_ext: formFileExt,
        file_size: formFileObj?.size ?? 80000,
        is_current: false,
        uploaded_by: currentUser.id,
        uploaded_at: toDateStr(),
        original_name: formFileName,
        file_category: 'form' as const,
        attach_doc_number: formDocNumber.trim(),
        attach_doc_name: formDocName.trim(),
        attach_department: formDepartment.trim(),
        form_folder: formFolder.trim(),
      };
      await fileService.create(newFile);
      setDocumentFiles([...documentFiles, newFile]);
      resetFormModal();
      setFormFileObj(null);
    } catch { alert('양식 업로드 중 오류가 발생했습니다.'); }
  };

  const toggleFolder = (name: string) => {
    setExpandedFolders(ef => {
      const next = new Set(ef);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleAddFolder = () => {
    const name = newFolder.name.trim();
    if (!name) { alert('폴더명을 입력하세요.'); return; }
    if (!allFolderNames.includes(name)) {
      const item: FolderItem = { id: `fd${Date.now()}`, name, doc_number: newFolder.doc_number.trim(), doc_name: newFolder.doc_name.trim(), department: newFolder.department.trim() };
      setFormFolders(ff => [...ff, item]);
      setExpandedFolders(ef => new Set([...ef, name]));
    }
    setShowFolderModal(false);
    setNewFolder({ ...EMPTY_FOLDER });
  };

  const resetInstructionModal = () => { setShowInstructionModal(false); setInstructionFileName(''); setInstructionDocNumber(''); setInstructionDocName(''); setInstructionRev(''); setInstructionUploadDate(''); setInstructionFileObj(null); };
  const handleInstructionUpload = async () => {
    if (!instructionDocNumber.trim()) { alert('문서번호를 입력하세요.'); return; }
    if (!instructionDocName.trim()) { alert('문서명을 입력하세요.'); return; }
    if (!instructionFileName) { alert('파일을 선택하세요.'); return; }
    try {
      let filePath = `/files/${instructionFileName}`;
      if (instructionFileObj) {
        filePath = await fileService.uploadFile(`instructions/${doc.id}/`, instructionFileObj);
      }
      const newFile = {
        id: `f${Date.now()}`,
        document_id: doc.id,
        rev_number: doc.current_rev,
        file_path: filePath,
        pdf_path: instructionFileExt === 'pdf' ? filePath : null,
        file_ext: instructionFileExt,
        file_size: instructionFileObj?.size ?? 80000,
        is_current: false,
        uploaded_by: currentUser.id,
        uploaded_at: instructionUploadDate.trim() || toDateStr(),
        original_name: instructionFileName,
        file_category: 'instruction' as const,
        attach_doc_number: instructionDocNumber.trim(),
        attach_doc_name: instructionDocName.trim(),
        attach_rev: instructionRev.trim(),
      };
      await fileService.create(newFile);
      setDocumentFiles([...documentFiles, newFile]);
      resetInstructionModal();
      setInstructionFileObj(null);
    } catch { alert('지침서 업로드 중 오류가 발생했습니다.'); }
  };

  const addRelation = async (targetDocId: string) => {
    if (relatedDocIds.includes(targetDocId)) return;
    const newRel = {
      id: `r${Date.now()}`,
      source_doc_id: doc.id,
      target_doc_id: targetDocId,
      created_by: currentUser.id,
      created_at: toDateStr(),
    };
    try {
      await relationService.create(newRel);
      setDocumentRelations([...documentRelations, newRel]);
      setShowRelationModal(false);
      setRelSearch('');
    } catch { alert('연관 문서 추가 중 오류가 발생했습니다.'); }
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'webview', label: '파일', icon: FileText },
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
            <p className="text-sm text-gray-500 mt-1">{doc.department} · {doc.current_rev} · 개정일자: {doc.updated_at}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.status !== 'APPROVED' && (
              <button
                onClick={canApprove ? handleApprove : undefined}
                disabled={!canApprove}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${canApprove ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'}`}
                title={canApprove ? '승인으로 변경합니다' : '권한이 없습니다'}
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
          {/* 현재 파일 영역 */}
          <div className="p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">현재 문서 파일</p>
            {!currentFile ? (
              <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 py-16">
                <div className="text-center text-gray-400">
                  <FileText size={40} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">등록된 파일이 없습니다.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-14 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs uppercase">{currentFile.file_ext}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{currentFile.original_name || currentFile.file_path.split('/').pop()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {doc.current_rev} · .{currentFile.file_ext} · {(currentFile.file_size / 1024).toFixed(0)}KB · {currentFile.uploaded_at}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenFile(currentFile)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={14} /> 열기
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={doc.status !== 'APPROVED'}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${doc.status === 'APPROVED' ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}
                    title={doc.status !== 'APPROVED' ? '승인된 문서만 다운로드 가능합니다' : undefined}
                  >
                    <Download size={14} /> 다운로드
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 파일 업로드 섹션 */}
          {canWrite && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
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
                ['개정일자', doc.updated_at],
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">지침서 <span className="text-sm font-normal text-gray-400 ml-1">({instructionFiles.length})</span></h3>
              {canWrite && (
                <button onClick={() => setShowInstructionModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus size={14} /> 지침서 추가
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">문서번호</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">문서명</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Rev</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">업로드일자</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">다운로드</th>
                    {canWrite && <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">삭제</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {instructionFiles.length === 0 ? (
                    <tr><td colSpan={canWrite ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-400">등록된 지침서가 없습니다.</td></tr>
                  ) : (
                    instructionFiles.map((f) => (
                      <tr key={f.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-sm font-semibold text-blue-600">{f.attach_doc_number || '-'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-800 font-medium">{f.attach_doc_name || f.file_path.split('/').pop()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600">{f.attach_rev || '-'}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-500">{f.uploaded_at}</td>
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={() => alert(`다운로드: ${f.file_path.split('/').pop()}\n(목업 - 실제 파일 없음)`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mx-auto">
                            <Download size={13} /> 다운로드
                          </button>
                        </td>
                        {canWrite && (
                          <td className="px-4 py-3.5 text-center">
                            <button onClick={async () => { try { await fileService.delete(f.id); if (f.file_path.includes('supabase')) await fileService.deleteFromStorage(f.file_path); setDocumentFiles(documentFiles.filter(df => df.id !== f.id)); } catch { alert('파일 삭제 중 오류가 발생했습니다.'); } }} className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
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

          {/* 양식 */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">양식 <span className="text-sm font-normal text-gray-400 ml-1">({allFiles.length})</span></h3>
              {canUploadForm && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowFolderModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                    <FolderPlus size={14} /> 폴더 추가
                  </button>
                  <button onClick={() => setShowFormModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <Plus size={14} /> 양식 추가
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">문서번호</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">문서명</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">담당부서</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">다운로드</th>
                    {canDeleteForm && <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">삭제</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allFolderNames.length === 0 && unfoldered.length === 0 && (
                    <tr><td colSpan={canDeleteForm ? 5 : 4} className="px-6 py-8 text-center text-gray-400">등록된 양식이 없습니다.</td></tr>
                  )}

                  {/* 폴더 행 + 하위 파일 행 */}
                  {allFolderItems.map(folderItem => {
                    const folder = folderItem.name;
                    const folderFiles = allFiles.filter(f => f.form_folder === folder);
                    const isExpanded = expandedFolders.has(folder);
                    const canUpload = canUploadToFolder(folder);
                    const canDelete = isAdminOrAuthor || currentUser.department === folderItem.department;
                    return (
                      <React.Fragment key={`group-${folder}`}>
                        {/* 폴더 행 — 컬럼 구조에 맞게 데이터 표시 */}
                        <tr
                          className="bg-amber-50 hover:bg-amber-100 cursor-pointer select-none transition-colors border-y border-amber-100"
                          onClick={() => toggleFolder(folder)}
                        >
                          {/* 문서번호 */}
                          <td className="px-4 py-2.5 font-mono text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? <ChevronDown size={13} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={13} className="text-gray-400 flex-shrink-0" />}
                              {folderItem.doc_number || '-'}
                            </div>
                          </td>
                          {/* 문서명 */}
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <FolderOpen size={14} className="text-yellow-500 flex-shrink-0" /> : <Folder size={14} className="text-yellow-500 flex-shrink-0" />}
                              <span className="text-sm font-semibold text-gray-800">{folderItem.doc_name || folder}</span>
                              <span className="text-xs text-gray-400">({folderFiles.length})</span>
                            </div>
                          </td>
                          {/* 담당부서 */}
                          <td className="px-4 py-2.5 text-sm text-gray-600">
                            {folderItem.department ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{folderItem.department}</span>
                            ) : '-'}
                          </td>
                          {/* 다운로드 컬럼: + 업로드 버튼 */}
                          <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                            {canUpload && (
                              <button
                                onClick={() => { setFormFolder(folder); setShowFormModal(true); }}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                title="이 폴더에 양식 추가"
                              >
                                <Plus size={12} /> 양식 추가
                              </button>
                            )}
                          </td>
                          {/* 삭제 */}
                          {canDeleteForm && (
                            <td className="px-4 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                              {canDelete && folderFiles.length === 0 && (
                                <button
                                  onClick={() => setFormFolders(ff => ff.filter(f => f.name !== folder))}
                                  className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors"
                                  title="빈 폴더 삭제"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>

                        {/* 폴더 내 파일 행 */}
                        {isExpanded && folderFiles.length === 0 && (
                          <tr key={`${folder}-empty`} className="bg-gray-50/50">
                            <td colSpan={canDeleteForm ? 5 : 4} className="pl-14 py-3 text-sm text-gray-400 italic">이 폴더에 양식이 없습니다.</td>
                          </tr>
                        )}
                        {isExpanded && folderFiles.map(f => (
                          <tr key={f.id} className="bg-gray-50/50 hover:bg-blue-50 transition-colors">
                            <td className="pl-14 pr-4 py-3 font-mono text-sm font-semibold text-blue-600">{f.attach_doc_number || '-'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <FileText size={13} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-800 font-medium">{f.attach_doc_name || f.file_path.split('/').pop()}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{f.attach_department || '-'}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => alert(`다운로드: ${f.file_path.split('/').pop()}\n(목업)`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mx-auto">
                                <Download size={13} /> 다운로드
                              </button>
                            </td>
                            {canDeleteForm && (
                              <td className="px-4 py-3 text-center">
                                <button onClick={async () => { try { await fileService.delete(f.id); if (f.file_path.includes('supabase')) await fileService.deleteFromStorage(f.file_path); setDocumentFiles(documentFiles.filter(df => df.id !== f.id)); } catch { alert('파일 삭제 중 오류가 발생했습니다.'); } }} className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}

                  {/* 폴더 미지정 파일 */}
                  {unfoldered.map(f => (
                    <tr key={f.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-sm font-semibold text-blue-600">{f.attach_doc_number || '-'}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-800 font-medium">{f.attach_doc_name || f.file_path.split('/').pop()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{f.attach_department || '-'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button onClick={() => alert(`다운로드: ${f.file_path.split('/').pop()}\n(목업)`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mx-auto">
                          <Download size={13} /> 다운로드
                        </button>
                      </td>
                      {canDeleteForm && (
                        <td className="px-4 py-3.5 text-center">
                          <button onClick={async () => { try { await fileService.delete(f.id); if (f.file_path.includes('supabase')) await fileService.deleteFromStorage(f.file_path); setDocumentFiles(documentFiles.filter(df => df.id !== f.id)); } catch { alert('파일 삭제 중 오류가 발생했습니다.'); } }} className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                      if (file) { setNewVerFile(file.name); setNewVerExt(file.name.split('.').pop() ?? 'pdf'); setNewVerFileObj(file); }
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
      <Modal isOpen={showFormModal} onClose={resetFormModal} title="양식 추가" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">폴더 <span className="text-red-500">*</span></label>
            {allFolderItems.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">먼저 폴더를 추가해 주세요.</p>
            ) : (
              <select
                value={formFolder}
                onChange={e => setFormFolder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">폴더를 선택하세요</option>
                {allFolderItems.filter(fi => canUploadToFolder(fi.name)).map(fi => (
                  <option key={fi.id} value={fi.name}>{fi.doc_name || fi.name}{fi.department ? ` [${fi.department}]` : ''}</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서번호 <span className="text-red-500">*</span></label>
              <input type="text" value={formDocNumber} onChange={e => setFormDocNumber(e.target.value)} placeholder="예) EXO-QF-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당부서</label>
              <select value={formDepartment} onChange={e => setFormDepartment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문서명 <span className="text-red-500">*</span></label>
            <input type="text" value={formDocName} onChange={e => setFormDocName(e.target.value)} placeholder="양식 문서명을 입력하세요" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
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
                  <input type="file" accept="*/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setFormFileName(file.name); setFormFileExt(file.name.split('.').pop() ?? 'pdf'); setFormFileObj(file); } }} />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={resetFormModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleFormUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">추가</button>
          </div>
        </div>
      </Modal>

      {/* Folder Create Modal */}
      <Modal isOpen={showFolderModal} onClose={() => { setShowFolderModal(false); setNewFolder({ ...EMPTY_FOLDER }); }} title="폴더 추가" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서번호</label>
              <input type="text" value={newFolder.doc_number} onChange={e => setNewFolder(f => ({ ...f, doc_number: e.target.value }))} placeholder="예) EXO-QF" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당부서</label>
              <select value={newFolder.department} onChange={e => setNewFolder(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">부서 선택</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문서명 <span className="text-red-500">*</span></label>
            <input type="text" value={newFolder.doc_name} onChange={e => setNewFolder(f => ({ ...f, doc_name: e.target.value, name: e.target.value }))} placeholder="폴더 문서명을 입력하세요" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
            <p className="text-xs text-gray-400 mt-0.5">폴더명으로 사용됩니다</p>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => { setShowFolderModal(false); setNewFolder({ ...EMPTY_FOLDER }); }} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
            <button onClick={handleAddFolder} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">추가</button>
          </div>
        </div>
      </Modal>

      {/* Instruction (지침서) Upload Modal */}
      <Modal isOpen={showInstructionModal} onClose={resetInstructionModal} title="지침서 추가" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문서번호 <span className="text-red-500">*</span></label>
              <input type="text" value={instructionDocNumber} onChange={e => setInstructionDocNumber(e.target.value)} placeholder="예) EXO-QI-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rev</label>
              <input type="text" value={instructionRev} onChange={e => setInstructionRev(e.target.value)} placeholder="예) Rev.00" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">문서명 <span className="text-red-500">*</span></label>
              <input type="text" value={instructionDocName} onChange={e => setInstructionDocName(e.target.value)} placeholder="지침서 문서명을 입력하세요" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">업로드일자</label>
              <input type="text" value={instructionUploadDate} onChange={e => setInstructionUploadDate(e.target.value)} placeholder="YYYY-MM-DD" maxLength={10} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-0.5">미입력 시 오늘 날짜</p>
            </div>
          </div>
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
                  <input type="file" accept="*/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setInstructionFileName(file.name); setInstructionFileExt(file.name.split('.').pop() ?? 'pdf'); setInstructionFileObj(file); } }} />
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={resetInstructionModal} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
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
