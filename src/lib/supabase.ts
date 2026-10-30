import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export const TEAM_MANAGER = {
  name: (import.meta.env.VITE_TEAM_MANAGER_NAME as string) || 'Aleix',
  email: (import.meta.env.VITE_TEAM_MANAGER_EMAIL as string) || '',
};
