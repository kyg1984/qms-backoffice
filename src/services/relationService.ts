import { supabase } from '../lib/supabase';
import type { DocumentRelation } from '../types';

export const relationService = {
  async getAll(): Promise<DocumentRelation[]> {
    const { data, error } = await supabase.from('document_relations').select('*').order('created_at');
    if (error) throw error;
    return (data || []) as DocumentRelation[];
  },

  async create(relation: DocumentRelation): Promise<void> {
    const { error } = await supabase.from('document_relations').insert(relation);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('document_relations').delete().eq('id', id);
    if (error) throw error;
  },
};
