import { supabase } from '../lib/supabase';
import type { DocumentHistory } from '../types';

export const historyService = {
  async getAll(): Promise<DocumentHistory[]> {
    const { data, error } = await supabase.from('document_histories').select('*').order('recorded_at');
    if (error) throw error;
    return (data || []) as DocumentHistory[];
  },

  async create(history: DocumentHistory): Promise<void> {
    const { error } = await supabase.from('document_histories').insert(history);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<DocumentHistory>): Promise<void> {
    const { error } = await supabase.from('document_histories').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('document_histories').delete().eq('id', id);
    if (error) throw error;
  },
};
