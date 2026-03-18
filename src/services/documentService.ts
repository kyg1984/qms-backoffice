import { supabase } from '../lib/supabase';
import type { Document } from '../types';

export const documentService = {
  async getAll(): Promise<Document[]> {
    const { data, error } = await supabase.from('documents').select('*').order('created_at');
    if (error) throw error;
    return (data || []) as Document[];
  },

  async create(doc: Document): Promise<void> {
    const { error } = await supabase.from('documents').insert(doc);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    const { error } = await supabase.from('documents').update(updates).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
  },
};
