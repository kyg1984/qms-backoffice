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
  async uploadFile(path: string, file: File): Promise<string> {
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) throw error;

    // Public URL 반환
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
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
