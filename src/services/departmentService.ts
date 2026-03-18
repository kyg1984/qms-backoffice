import { supabase } from '../lib/supabase';

export const departmentService = {
  async getAll(): Promise<string[]> {
    const { data, error } = await supabase.from('departments').select('name').order('id');
    if (error) throw error;
    return (data || []).map(d => d.name);
  },

  async create(name: string): Promise<void> {
    const { error } = await supabase.from('departments').insert({ name });
    if (error) throw error;
  },

  async delete(name: string): Promise<void> {
    const { error } = await supabase.from('departments').delete().eq('name', name);
    if (error) throw error;
  },
};
