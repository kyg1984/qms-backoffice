-- =============================================
-- QMS Backoffice - Supabase 초기 스키마 + 시드 데이터
-- Supabase 대시보드 → SQL Editor → 붙여넣기 후 Run
-- =============================================

-- 1. 기존 테이블 삭제 (재실행 시 초기화)
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS document_relations CASCADE;
DROP TABLE IF EXISTS document_histories CASCADE;
DROP TABLE IF EXISTS document_files CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 사용자 테이블
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  department TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 3. 부서 테이블
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 4. 문서 테이블
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  doc_number TEXT NOT NULL,
  doc_name TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REVIEW',
  current_rev TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 5. 문서 파일 테이블
CREATE TABLE document_files (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  rev_number TEXT NOT NULL,
  file_path TEXT NOT NULL,
  pdf_path TEXT,
  file_ext TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  is_current BOOLEAN DEFAULT TRUE,
  uploaded_by TEXT,
  uploaded_at TEXT,
  file_category TEXT,
  attach_doc_number TEXT,
  attach_doc_name TEXT,
  attach_rev TEXT,
  attach_department TEXT,
  form_folder TEXT
);

-- 6. 문서 이력 테이블
CREATE TABLE document_histories (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  revision_date TEXT,
  rev_number TEXT,
  doc_name TEXT,
  doc_number TEXT,
  department TEXT,
  change_summary TEXT,
  recorded_by TEXT,
  recorded_at TEXT,
  updated_by TEXT,
  updated_at TEXT
);

-- 7. 문서 관계 테이블
CREATE TABLE document_relations (
  id TEXT PRIMARY KEY,
  source_doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  target_doc_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  created_by TEXT,
  created_at TEXT
);

-- 8. 권한 요청 테이블
CREATE TABLE access_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  department TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  role TEXT,
  requested_at TEXT NOT NULL,
  reviewed_at TEXT
);

-- =============================================
-- RLS 비활성화 (Publishable key로 접근 허용)
-- =============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_histories DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_relations DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 시드 데이터 삽입
-- =============================================

-- 관리자 계정
INSERT INTO users (id, name, email, password, role, department, is_active, created_at, updated_at)
VALUES ('u1', '관리자', 'admin@cosmo-robotics.com', 'admin123', 'ADMIN', '품질팀', TRUE, '2024-01-01', '2024-01-01');

-- 부서 목록
INSERT INTO departments (name) VALUES
  ('품질팀'), ('개발팀'), ('생산팀'), ('구매팀'), ('영업팀'), ('경영지원팀');

-- 문서 목록
INSERT INTO documents (id, doc_number, doc_name, doc_type, department, status, current_rev, created_by, created_at, updated_at)
VALUES
  ('d1', 'QP-001', '설계변경절차서',       'QP', '품질팀', 'APPROVED', 'Rev.02', 'u1', '2024-01-10', '2025-11-20'),
  ('d2', 'WI-012', '설계변경 작업지침서',   'QI', '개발팀', 'REVIEW',   'Rev.01', 'u1', '2024-01-15', '2025-12-05'),
  ('d3', 'QM-001', '품질경영매뉴얼',        'QM', '품질팀', 'APPROVED', 'Rev.03', 'u1', '2024-01-01', '2025-10-15'),
  ('d4', 'QP-002', '공급자 평가 절차서',    'QP', '구매팀', 'REVIEW',   'Rev.00', 'u1', '2025-03-01', '2026-01-10'),
  ('d5', 'WI-023', '납땜 작업지침서',       'QI', '생산팀', 'APPROVED', 'Rev.01', 'u1', '2024-03-10', '2025-09-08'),
  ('d6', 'QP-003', '부적합품 관리 절차서',  'QP', '품질팀', 'REVIEW',   'Rev.01', 'u1', '2024-04-01', '2026-02-20'),
  ('d7', 'WI-031', '검사 작업지침서',       'QI', '품질팀', 'REVIEW',   'Rev.00', 'u1', '2026-02-01', '2026-03-01'),
  ('d8', 'QP-004', '교정 관리 절차서',      'QP', '품질팀', 'APPROVED', 'Rev.02', 'u1', '2024-05-01', '2025-08-12');

-- 문서 파일
INSERT INTO document_files (id, document_id, rev_number, file_path, pdf_path, file_ext, file_size, is_current, uploaded_by, uploaded_at)
VALUES
  ('f1',  'd1', 'Rev.00', '/files/QP-001_Rev00.pdf',  NULL,                      'pdf',  524288,  FALSE, 'u1', '2024-01-10'),
  ('f2',  'd1', 'Rev.01', '/files/QP-001_Rev01.docx', '/files/QP-001_Rev01.pdf', 'docx', 786432,  FALSE, 'u1', '2024-06-15'),
  ('f3',  'd1', 'Rev.02', '/files/QP-001_Rev02.pdf',  NULL,                      'pdf',  921600,  TRUE,  'u1', '2025-11-20'),
  ('f4',  'd2', 'Rev.00', '/files/WI-012_Rev00.pdf',  NULL,                      'pdf',  335544,  FALSE, 'u1', '2024-01-15'),
  ('f5',  'd2', 'Rev.01', '/files/WI-012_Rev01.xlsx', '/files/WI-012_Rev01.pdf', 'xlsx', 655360,  TRUE,  'u1', '2025-12-05'),
  ('f6',  'd3', 'Rev.00', '/files/QM-001_Rev00.pdf',  NULL,                      'pdf',  1048576, FALSE, 'u1', '2024-01-01'),
  ('f7',  'd3', 'Rev.01', '/files/QM-001_Rev01.pdf',  NULL,                      'pdf',  1258291, FALSE, 'u1', '2024-08-20'),
  ('f8',  'd3', 'Rev.02', '/files/QM-001_Rev02.pdf',  NULL,                      'pdf',  1310720, FALSE, 'u1', '2025-03-15'),
  ('f9',  'd3', 'Rev.03', '/files/QM-001_Rev03.pdf',  NULL,                      'pdf',  1258291, TRUE,  'u1', '2025-10-15'),
  ('f10', 'd4', 'Rev.00', '/files/QP-002_Rev00.pdf',  NULL,                      'pdf',  450560,  TRUE,  'u1', '2026-01-10'),
  ('f11', 'd5', 'Rev.01', '/files/WI-023_Rev01.pdf',  NULL,                      'pdf',  368640,  TRUE,  'u1', '2025-09-08');

-- 문서 이력
INSERT INTO document_histories (id, document_id, revision_date, rev_number, doc_name, doc_number, department, change_summary, recorded_by, recorded_at)
VALUES
  ('h1',  'd1', '2024-01-10', 'Rev.00', '설계변경절차서',     'QP-001', '품질팀', '최초 제정', 'u1', '2024-01-10'),
  ('h2',  'd1', '2024-06-15', 'Rev.01', '설계변경절차서',     'QP-001', '품질팀', '3.2항 검토주기 수정 (연 1회 → 반기 1회)', 'u1', '2024-06-15'),
  ('h3',  'd1', '2025-11-20', 'Rev.02', '설계변경절차서',     'QP-001', '품질팀', '4.1항 승인권자 변경, 별지 1호 서식 개정', 'u1', '2025-11-20'),
  ('h4',  'd2', '2024-01-15', 'Rev.00', '설계변경 작업지침서','WI-012', '개발팀', '최초 제정', 'u1', '2024-01-15'),
  ('h5',  'd2', '2025-12-05', 'Rev.01', '설계변경 작업지침서','WI-012', '개발팀', '작업 절차 2단계 추가, 그림 3 업데이트', 'u1', '2025-12-05'),
  ('h6',  'd3', '2024-01-01', 'Rev.00', '품질경영매뉴얼',     'QM-001', '품질팀', '최초 제정', 'u1', '2024-01-01'),
  ('h7',  'd3', '2024-08-20', 'Rev.01', '품질경영매뉴얼',     'QM-001', '품질팀', 'ISO 13485:2016 5.6항 반영', 'u1', '2024-08-20'),
  ('h8',  'd3', '2025-03-15', 'Rev.02', '품질경영매뉴얼',     'QM-001', '품질팀', '조직도 및 책임권한표 개정', 'u1', '2025-03-15'),
  ('h9',  'd3', '2025-10-15', 'Rev.03', '품질경영매뉴얼',     'QM-001', '품질팀', '연간 목표 지표 갱신 및 8항 위험관리 절차 보강', 'u1', '2025-10-15'),
  ('h10', 'd4', '2026-01-10', 'Rev.00', '공급자 평가 절차서', 'QP-002', '구매팀', '최초 제정', 'u1', '2026-01-10');

-- 문서 관계
INSERT INTO document_relations (id, source_doc_id, target_doc_id, created_by, created_at)
VALUES
  ('r1', 'd1', 'd2', 'u1', '2024-02-01'),
  ('r2', 'd1', 'd3', 'u1', '2024-02-01'),
  ('r3', 'd3', 'd4', 'u1', '2025-04-01'),
  ('r4', 'd2', 'd5', 'u1', '2024-04-01');
