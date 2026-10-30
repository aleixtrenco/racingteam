import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Handshake, LogOut, Settings, Trash2, Trophy, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { deleteMyAccount } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { Button, ErrorNote, Input, Label } from './ui';

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

export function ProfileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, isAdmin, signOut, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (!open || !profile) return null;

  const saveName = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id);
    setSaving(false);
    if (error) return setError(error);
    await refreshProfile();
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount(profile.id);
      qc.clear();
    } catch (e) {
      setError(e);
      setDeleting(false);
    }
  };

  const link = 'flex min-h-touch items-center gap-3 rounded-xl px-3 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Profile">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] dark:bg-neutral-900">
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-extrabold">Profile</h2>
          <button onClick={onClose} className="-mr-2 flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3 px-5 pb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow text-lg font-extrabold text-brand-black">{initials(profile.full_name)}</span>
          <div className="min-w-0">
            <p className="truncate font-extrabold">{profile.full_name || 'Athlete'}</p>
            <p className="truncate text-sm text-neutral-500">{profile.email}</p>
            <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold uppercase dark:bg-neutral-800">{profile.role}</span>
          </div>
        </div>

        <div className="space-y-3 border-t border-neutral-200 px-5 py-5 dark:border-neutral-800">
          <Label label="Display name" hint="Shown on race lists, results and the ranking.">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Label>
          <Button variant="secondary" className="w-full" onClick={saveName} loading={saving} disabled={!name.trim() || name.trim() === profile.full_name}>
            Save name
          </Button>
        </div>

        {isAdmin && (
          <nav className="space-y-1 border-t border-neutral-200 px-3 py-4 dark:border-neutral-800">
            <p className="px-3 pb-1 text-xs font-bold uppercase tracking-widest text-neutral-500">Admin</p>
            <Link to="/admin" onClick={onClose} className={link}>
              <Settings className="h-5 w-5" /> Races
            </Link>
            <Link to="/admin/results" onClick={onClose} className={link}>
              <Trophy className="h-5 w-5" /> Results entry
            </Link>
            <Link to="/admin/sponsors" onClick={onClose} className={link}>
              <Handshake className="h-5 w-5" /> Sponsors
            </Link>
            <Link to="/admin/athletes" onClick={onClose} className={link}>
              <BarChart3 className="h-5 w-5" /> Athletes &amp; participation
            </Link>
          </nav>
        )}

        <div className="mt-auto space-y-2 border-t border-neutral-200 px-5 py-5 dark:border-neutral-800">
          <ErrorNote error={error} />
          <Button variant="secondary" className="w-full" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
          {!confirmDelete ? (
            <Button variant="ghost" className="w-full text-red-600 dark:text-red-400" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete my account
            </Button>
          ) : (
            <div className="space-y-2 rounded-xl bg-red-50 p-3 text-sm dark:bg-red-950/50">
              <p className="text-red-800 dark:text-red-200">This permanently removes your registrations, results, photos and account. It can't be undone.</p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  Keep account
                </Button>
                <Button variant="danger" className="flex-1" onClick={remove} loading={deleting}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
