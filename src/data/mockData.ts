import type {
  User,
  Document,
  DocumentFile,
  DocumentHistory,
  DocumentRelation,
  DocumentStatusLog,
} from '../types';

export const mockUsers: User[] = [
  { id: 'u1', name: '관리자', email: 'admin@company.com', password: 'admin1234', role: 'ADMIN', is_active: true, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

export const mockDocuments: Document[] = [
  { id: 'd1', doc_number: 'QP-001', doc_name: '설계변경절차서', doc_type: 'QP', department: '품질팀', status: 'APPROVED', current_rev: 'Rev.02', created_by: 'u1', created_at: '2024-01-10', updated_at: '2025-11-20' },
  { id: 'd2', doc_number: 'WI-012', doc_name: '설계변경 작업지침서', doc_type: 'QI', department: '개발팀', status: 'REVIEW', current_rev: 'Rev.01', created_by: 'u1', created_at: '2024-01-15', updated_at: '2025-12-05' },
  { id: 'd3', doc_number: 'QM-001', doc_name: '품질경영매뉴얼', doc_type: 'QM', department: '품질팀', status: 'APPROVED', current_rev: 'Rev.03', created_by: 'u1', created_at: '2024-01-01', updated_at: '2025-10-15' },
  { id: 'd4', doc_number: 'QP-002', doc_name: '공급자 평가 절차서', doc_type: 'QP', department: '구매팀', status: 'REVIEW', current_rev: 'Rev.00', created_by: 'u1', created_at: '2025-03-01', updated_at: '2026-01-10' },
  { id: 'd5', doc_number: 'WI-023', doc_name: '납땜 작업지침서', doc_type: 'QI', department: '생산팀', status: 'APPROVED', current_rev: 'Rev.01', created_by: 'u1', created_at: '2024-03-10', updated_at: '2025-09-08' },
  { id: 'd6', doc_number: 'QP-003', doc_name: '부적합품 관리 절차서', doc_type: 'QP', department: '품질팀', status: 'REVIEW', current_rev: 'Rev.01', created_by: 'u1', created_at: '2024-04-01', updated_at: '2026-02-20' },
  { id: 'd7', doc_number: 'WI-031', doc_name: '검사 작업지침서', doc_type: 'QI', department: '품질팀', status: 'REVIEW', current_rev: 'Rev.00', created_by: 'u1', created_at: '2026-02-01', updated_at: '2026-03-01' },
  { id: 'd8', doc_number: 'QP-004', doc_name: '교정 관리 절차서', doc_type: 'QP', department: '품질팀', status: 'APPROVED', current_rev: 'Rev.02', created_by: 'u1', created_at: '2024-05-01', updated_at: '2025-08-12' },
];

export const mockDocumentFiles: DocumentFile[] = [
  { id: 'f1', document_id: 'd1', rev_number: 'Rev.02', file_path: '/files/QP-001_Rev02.pdf', pdf_path: '/files/QP-001_Rev02.pdf', file_ext: 'pdf', file_size: 245000, is_current: true, uploaded_by: 'u1', uploaded_at: '2025-11-20' },
  { id: 'f2', document_id: 'd1', rev_number: 'Rev.01', file_path: '/files/QP-001_Rev01.pdf', pdf_path: '/files/QP-001_Rev01.pdf', file_ext: 'pdf', file_size: 198000, is_current: false, uploaded_by: 'u1', uploaded_at: '2024-06-15' },
  { id: 'f3', document_id: 'd1', rev_number: 'Rev.00', file_path: '/files/QP-001_Rev00.pdf', pdf_path: '/files/QP-001_Rev00.pdf', file_ext: 'pdf', file_size: 187000, is_current: false, uploaded_by: 'u1', uploaded_at: '2024-01-10' },
  { id: 'f4', document_id: 'd2', rev_number: 'Rev.01', file_path: '/files/WI-012_Rev01.docx', pdf_path: null, file_ext: 'docx', file_size: 320000, is_current: true, uploaded_by: 'u1', uploaded_at: '2025-12-05' },
  { id: 'f5', document_id: 'd2', rev_number: 'Rev.00', file_path: '/files/WI-012_Rev00.docx', pdf_path: '/files/WI-012_Rev00_converted.pdf', file_ext: 'docx', file_size: 285000, is_current: false, uploaded_by: 'u1', uploaded_at: '2024-01-15' },
  { id: 'f6', document_id: 'd3', rev_number: 'Rev.03', file_path: '/files/QM-001_Rev03.pdf', pdf_path: '/files/QM-001_Rev03.pdf', file_ext: 'pdf', file_size: 1245000, is_current: true, uploaded_by: 'u1', uploaded_at: '2025-10-15' },
  { id: 'f7', document_id: 'd4', rev_number: 'Rev.00', file_path: '/files/QP-002_Rev00.xlsx', pdf_path: null, file_ext: 'xlsx', file_size: 98000, is_current: true, uploaded_by: 'u1', uploaded_at: '2026-01-10' },
  { id: 'f8', document_id: 'd5', rev_number: 'Rev.01', file_path: '/files/WI-023_Rev01.pdf', pdf_path: '/files/WI-023_Rev01.pdf', file_ext: 'pdf', file_size: 175000, is_current: true, uploaded_by: 'u1', uploaded_at: '2025-09-08' },
  { id: 'f9', document_id: 'd6', rev_number: 'Rev.01', file_path: '/files/QP-003_Rev01.pdf', pdf_path: '/files/QP-003_Rev01.pdf', file_ext: 'pdf', file_size: 210000, is_current: true, uploaded_by: 'u1', uploaded_at: '2026-02-20' },
  { id: 'f10', document_id: 'd7', rev_number: 'Rev.00', file_path: '/files/WI-031_Rev00.docx', pdf_path: null, file_ext: 'docx', file_size: 145000, is_current: true, uploaded_by: 'u1', uploaded_at: '2026-03-01' },
  { id: 'f11', document_id: 'd8', rev_number: 'Rev.02', file_path: '/files/QP-004_Rev02.pdf', pdf_path: '/files/QP-004_Rev02.pdf', file_ext: 'pdf', file_size: 188000, is_current: true, uploaded_by: 'u1', uploaded_at: '2025-08-12' },
];

export const mockDocumentHistories: DocumentHistory[] = [
  { id: 'h1', document_id: 'd1', revision_date: '2024-01-10', rev_number: 'Rev.00', doc_name: '설계변경절차서', doc_number: 'QP-001', department: '품질팀', change_summary: '최초 제정', recorded_by: 'u1', recorded_at: '2024-01-10' },
  { id: 'h2', document_id: 'd1', revision_date: '2024-06-15', rev_number: 'Rev.01', doc_name: '설계변경절차서', doc_number: 'QP-001', department: '품질팀', change_summary: '3.2항 검토주기 수정 (연 1회 → 반기 1회)', recorded_by: 'u1', recorded_at: '2024-06-15' },
  { id: 'h3', document_id: 'd1', revision_date: '2025-11-20', rev_number: 'Rev.02', doc_name: '설계변경절차서', doc_number: 'QP-001', department: '품질팀', change_summary: '4.1항 승인권자 변경, 별지 1호 서식 개정', recorded_by: 'u1', recorded_at: '2025-11-20' },
  { id: 'h4', document_id: 'd2', revision_date: '2024-01-15', rev_number: 'Rev.00', doc_name: '설계변경 작업지침서', doc_number: 'WI-012', department: '개발팀', change_summary: '최초 제정', recorded_by: 'u1', recorded_at: '2024-01-15' },
  { id: 'h5', document_id: 'd2', revision_date: '2025-12-05', rev_number: 'Rev.01', doc_name: '설계변경 작업지침서', doc_number: 'WI-012', department: '개발팀', change_summary: '작업 절차 2단계 추가, 그림 3 업데이트', recorded_by: 'u1', recorded_at: '2025-12-05' },
  { id: 'h6', document_id: 'd3', revision_date: '2024-01-01', rev_number: 'Rev.00', doc_name: '품질경영매뉴얼', doc_number: 'QM-001', department: '품질팀', change_summary: '최초 제정', recorded_by: 'u1', recorded_at: '2024-01-01' },
  { id: 'h7', document_id: 'd3', revision_date: '2024-08-20', rev_number: 'Rev.01', doc_name: '품질경영매뉴얼', doc_number: 'QM-001', department: '품질팀', change_summary: 'ISO 13485:2016 5.6항 반영', recorded_by: 'u1', recorded_at: '2024-08-20' },
  { id: 'h8', document_id: 'd3', revision_date: '2025-03-15', rev_number: 'Rev.02', doc_name: '품질경영매뉴얼', doc_number: 'QM-001', department: '품질팀', change_summary: '조직도 및 책임권한표 개정', recorded_by: 'u1', recorded_at: '2025-03-15' },
  { id: 'h9', document_id: 'd3', revision_date: '2025-10-15', rev_number: 'Rev.03', doc_name: '품질경영매뉴얼', doc_number: 'QM-001', department: '품질팀', change_summary: '연간 목표 지표 갱신 및 8항 위험관리 절차 보강', recorded_by: 'u1', recorded_at: '2025-10-15' },
  { id: 'h10', document_id: 'd4', revision_date: '2026-01-10', rev_number: 'Rev.00', doc_name: '공급자 평가 절차서', doc_number: 'QP-002', department: '구매팀', change_summary: '최초 제정', recorded_by: 'u1', recorded_at: '2026-01-10' },
];

export const mockDocumentRelations: DocumentRelation[] = [
  { id: 'r1', source_doc_id: 'd1', target_doc_id: 'd2', created_by: 'u1', created_at: '2024-01-15' },
  { id: 'r2', source_doc_id: 'd1', target_doc_id: 'd3', created_by: 'u1', created_at: '2024-02-01' },
  { id: 'r3', source_doc_id: 'd3', target_doc_id: 'd6', created_by: 'u1', created_at: '2024-04-05' },
  { id: 'r4', source_doc_id: 'd5', target_doc_id: 'd8', created_by: 'u1', created_at: '2024-05-10' },
];

export const mockStatusLogs: DocumentStatusLog[] = [
  { id: 'sl1', document_id: 'd1', from_status: null, to_status: 'DRAFT', changed_by: 'u1', changed_at: '2024-01-10' },
  { id: 'sl2', document_id: 'd1', from_status: 'DRAFT', to_status: 'REVIEW', changed_by: 'u1', changed_at: '2024-01-20' },
  { id: 'sl3', document_id: 'd1', from_status: 'REVIEW', to_status: 'APPROVED', changed_by: 'u1', changed_at: '2024-02-01' },
];

export const getCurrentUser = (): User => mockUsers[0]; // Admin by default
