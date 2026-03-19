import { supabase } from '../lib/supabase';
import type { DocumentFile } from '../types';

const BUCKET = 'qms-documents';

// 파일명에서 특수문자/한글/공백 제거 → Storage 경로 안전하게 변환
const sanitizeFileName = (name: string): string => {
  const ext = name.includes('.') ? '.' + name.split('.').pop() : '';
  const base = name.slice(0, name.length - ext.length);
  const safe = base
    .replace(/[^\x00-\x7F]/g, '') // 한글 등 비ASCII 제거
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 특수문자 → 언더스코어
    .replace(/_+/g, '_') // 연속 언더스코어 정리
    .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
    || 'file'; // 빈 경우 기본값
  return safe + ext.toLowerCase();
};

export const fileService = {
  async getAll(): Promise<DocumentFile[]> {
    const { data, error } = await supabase.from('document_files').select('*').order('uploaded_at');
    if (error) throw error;
    return (data || []) as DocumentFile[];
  },

  async create(file: DocumentFile): Promise<void> {
    const { error } = await supabase.from('document_files').insert(file);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<DocumentFile>): Promise<void> {
    const { error } = await supabase.from('document_files').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('document_files').delete().eq('id', id);
    if (error) throw error;
  },

  // 실제 파일 업로드 → Supabase Storage
  async uploadFile(path: string, file: File): Promise<string> {
    // 경로의 파일명 부분만 안전하게 변환 (폴더 경로는 유지)
    const parts = path.split('/');
    const rawFileName = parts.pop() ?? file.name;
    // timestamp_ 접두사가 있으면 분리
    const tsMatch = rawFileName.match(/^(\d+_)(.*)/);
    const safeFileName = tsMatch
      ? tsMatch[1] + sanitizeFileName(tsMatch[2])
      : sanitizeFileName(rawFileName);
    const safePath = [...parts, safeFileName].join('/');

    const { error } = await supabase.storage.from(BUCKET).upload(safePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });
    if (error) {
      console.error('[Storage upload error]', error);
      throw new Error(error.message);
    }

    // Public URL 반환
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(safePath);
    return data.publicUrl;
  },

  // 다운로드용 Signed URL (1시간 유효)
  async getSignedUrl(path: string): Promise<string> {
    // Storage URL인 경우 path 추출
    const storagePath = path.includes('/object/public/')
      ? path.split(`${BUCKET}/`)[1]
      : path;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  // 파일 삭제 (Storage에서도)
  async deleteFromStorage(path: string): Promise<void> {
    if (!path.includes('supabase')) return; // 목업 경로는 스킵
    const storagePath = path.split(`${BUCKET}/`)[1];
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
  },
};
