// Google sign-in / sign-up. The same flow creates the account on first use;
// the database then creates the athlete's racing profile (name + photo from Google).
import { Capacitor } from '@capacitor/core';
import { isDemo, supabase } from './supabase';

/** Deep link the native app registers (see README → Native apps). */
export const NATIVE_REDIRECT = 'ae.wolfis.racingteam://auth-callback';

export async function signInWithGoogle() {
  if (isDemo) {
    // Preview: behaves like a brand-new rider signing up with Google.
    const { error } = await supabase.auth.signInWithPassword({ email: 'new.rider@gmail.com', password: 'google-preview' });
    if (error) throw error;
    return;
  }
  if (Capacitor.isNativePlatform()) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
    });
    if (error) throw error;
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: data.url, presentationStyle: 'popover' });
    return;
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
}

/** Native app: finish sign-in when Google redirects back to the app. */
export async function listenForNativeAuth() {
  if (!Capacitor.isNativePlatform()) return;
  const { App } = await import('@capacitor/app');
  App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(NATIVE_REDIRECT)) return;
    const code = new URL(url).searchParams.get('code');
    if (code) await supabase.auth.exchangeCodeForSession(code);
    const { Browser } = await import('@capacitor/browser');
    await Browser.close().catch(() => undefined);
  });
}

/** Error passed back in the URL when Google sign-in was cancelled or failed. */
export function oauthErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search || window.location.hash.replace(/^#/, ''));
  const msg = params.get('error_description');
  if (msg) window.history.replaceState(null, '', window.location.pathname);
  return msg;
}
