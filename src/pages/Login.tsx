import { useState, type FormEvent } from 'react';
import { supabase, isConfigured, isDemo } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Button, ErrorNote, Input, Label } from '@/components/ui';

type Mode = 'signin' | 'signup' | 'reset';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage('');
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setMessage('Check your inbox to confirm your email, then sign in.');
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage('If that email has an account, a reset link is on its way.');
      }
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    if (isDemo) {
      const { error } = await supabase.auth.signInWithPassword({ email: 'demo@wolfis.ae', password: 'demo-preview' });
      return error && setError(error);
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
    if (error) setError(error);
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-black text-white">
      <div aria-hidden className="absolute -right-10 -top-10 h-[230px] w-[120px] skew-x-[-18deg] bg-brand-yellow sm:-right-32 sm:h-[420px] sm:w-[40%]" />
      <div aria-hidden className="absolute -right-10 -top-10 h-[230px] w-[120px] -translate-x-[30px] skew-x-[-18deg] border-l-[8px] border-white/90 sm:-right-32 sm:h-[420px] sm:w-[40%] sm:-translate-x-[38px] sm:border-l-[10px]" />
      <div className="relative flex flex-1 flex-col justify-end px-6 pb-10 pt-[calc(4rem+env(safe-area-inset-top))] sm:items-center sm:justify-center">
        <Logo white className="h-16 self-start sm:h-20 sm:self-center" />
        <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-neutral-300 sm:text-center">The team's race calendar, sign-ups, results and season ranking, in one place.</p>
      </div>
      <div className="relative rounded-t-[28px] bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 text-brand-black dark:bg-neutral-900 dark:text-white sm:mx-auto sm:mb-16 sm:w-full sm:max-w-md sm:rounded-[28px] sm:pb-8">
        <h1 className="text-xl font-extrabold">{mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset password'}</h1>
        {!isConfigured && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase isn't configured yet. Copy <code>.env.example</code> to <code>.env</code> and add your project URL and anon key.</p>
        )}

        {mode !== 'reset' && (
          <>
            <Button variant="secondary" className="mt-5 w-full" onClick={google} type="button">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.1v2.9A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.8 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2.1A11 11 0 0 0 1 12c0 1.8.4 3.4 1.1 4.9L5.8 14z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1L5.8 10c.9-2.7 3.3-4.6 6.2-4.6z" />
              </svg>
              Continue with Google
            </Button>
            <div className="my-5 flex items-center gap-3 text-xs text-neutral-400">
              <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" /> or <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <Label label="Full name">
              <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </Label>
          )}
          <Label label="Email">
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          </Label>
          {mode !== 'reset' && (
            <Label label="Password">
              <Input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </Label>
          )}
          <ErrorNote error={error} />
          {message && <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">{message}</p>}
          <Button type="submit" className="w-full" loading={busy}>
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-1 text-sm">
          {mode === 'signin' && (
            <>
              <button className="min-h-touch font-bold underline" onClick={() => setMode('signup')}>
                New to the team? Create an account
              </button>
              <button className="min-h-touch text-neutral-500" onClick={() => setMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'signin' && (
            <button className="min-h-touch font-bold underline" onClick={() => setMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
