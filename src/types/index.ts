export type DocType = 'QI' | 'QP' | 'QM';
export type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED';
export type UserRole = 'ADMIN' | 'AUTHOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  doc_number: string;
  doc_name: string;
  doc_type: DocType;
  department: string;
  status: DocStatus;
  current_rev: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentFile {
  id: string;
  document_id: string;
  rev_number: string;
  file_path: string;
  pdf_path: string | null;
  file_ext: string;
  file_size: number;
  is_current: boolean;
  uploaded_by: string;
  uploaded_at: string;
  file_category?: 'form' | 'instruction';
  attach_doc_number?: string;
  attach_doc_name?: string;
  attach_rev?: string;
  form_folder?: string;
}

export interface DocumentHistory {
  id: string;
  document_id: string;
  revision_date: string;
  rev_number: string;
  doc_name: string;
  doc_number: string;
  department: string;
  change_summary: string;
  recorded_by: string;
  recorded_at: string;
  updated_by?: string;
  updated_at?: string;
}

export interface DocumentRelation {
  id: string;
  source_doc_id: string;
  target_doc_id: string;
  created_by: string;
  created_at: string;
}

export interface DocumentStatusLog {
  id: string;
  document_id: string;
  from_status: DocStatus | null;
  to_status: DocStatus;
  changed_by: string;
  changed_at: string;
}
