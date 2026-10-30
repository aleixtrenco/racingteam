import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Sample-data preview build (no real backend). */
export const isDemo = import.meta.env.VITE_DEMO === 'true';

export const isConfigured = Boolean(url && key);

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'missing-anon-key', {
  // PKCE so the native app can finish Google sign-in from a deep link.
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
});

export const TEAM_MANAGER = {
  name: (import.meta.env.VITE_TEAM_MANAGER_NAME as string) || 'Aleix',
  email: (import.meta.env.VITE_TEAM_MANAGER_EMAIL as string) || '',
};
