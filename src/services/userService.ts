import { supabase } from '../lib/supabase';
import type { User } from '../types';

export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) throw error;
    return (data || []) as User[];
  },

  async create(user: User): Promise<void> {
    const { error } = await supabase.from('users').insert(user);
    if (error) throw error;
  },

  async update(id: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (error) throw error;
  },

  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    if (error || !data) return null;
    if ((data as User).password !== password) return null;
    return data as User;
  },
};
