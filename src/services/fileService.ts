import { supabase } from '../lib/supabase';
import type { DocumentFile } from '../types';

const BUCKET = 'qms-documents';

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
  // path: 폴더 경로 (예: documents/d1/), file: 실제 파일 객체
  // Storage에는 UUID 기반 경로 저장, 원본 파일명은 DB original_name 컬럼에 보존
  async uploadFile(folderPath: string, file: File): Promise<string> {
    const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'bin';
    const uuid = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const safePath = `${folderPath}${uuid}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(safePath, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    });
    if (error) {
      console.error('[Storage upload error]', error);
      throw new Error(error.message);
    }

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
