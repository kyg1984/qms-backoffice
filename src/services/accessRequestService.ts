import { supabase } from '../lib/supabase';
import type { AccessRequest } from '../types';

export const accessRequestService = {
  async getAll(): Promise<AccessRequest[]> {
    const { data, error } = await supabase.from('access_requests').select('*').order('requested_at', { ascending: false });
    if (error) throw error;
    return (data || []) as AccessRequest[];
  },

  async create(request: AccessRequest): Promise<void> {
    const { error } = await supabase.from('access_requests').insert(request);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<AccessRequest>): Promise<void> {
    const { error } = await supabase.from('access_requests').update(updates).eq('id', id);
    if (error) throw error;
  },
};
