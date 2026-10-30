import { useState, type FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { uploadAvatar, useSaveProfile, type ProfileInput } from '@/hooks/useData';
import { DISCIPLINES, TSHIRT_SIZES, type Discipline, type Profile } from '@/lib/types';
import { Avatar } from './Avatar';
import { Button, ErrorNote, Input, Label, Select, Textarea, cx } from './ui';

const cleanInstagram = (v: string) => v.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').replace(/\/$/, '');
const cleanUrl = (v: string) => (!v.trim() ? null : /^https?:\/\//.test(v.trim()) ? v.trim() : `https://${v.trim()}`);

/** Racing profile fields, used for first-time setup and for editing later. */
export function ProfileForm({ profile, submitLabel, onDone, onCancel, markOnboarded }: { profile: Profile; submitLabel: string; onDone: () => void; onCancel?: () => void; markOnboarded?: boolean }) {
  const { refreshProfile } = useAuth();
  const save = useSaveProfile();
  const [form, setForm] = useState<ProfileInput>({
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    disciplines: profile.disciplines ?? [],
    tshirt_size: profile.tshirt_size,
    bio: profile.bio,
    strava_url: profile.strava_url,
    instagram: profile.instagram,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const set = <K extends keyof ProfileInput>(k: K, v: ProfileInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (d: Discipline) => set('disciplines', form.disciplines.includes(d) ? form.disciplines.filter((x) => x !== d) : [...form.disciplines, d]);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      set('avatar_url', await uploadAvatar(profile.id, file));
    } catch (e) {
      setError(e);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await save.mutateAsync({
        id: profile.id,
        ...form,
        full_name: form.full_name.trim(),
        bio: form.bio?.trim() || null,
        strava_url: cleanUrl(form.strava_url ?? ''),
        instagram: cleanInstagram(form.instagram ?? '') || null,
        ...(markOnboarded ? { onboarded_at: new Date().toISOString() } : {}),
      });
      await refreshProfile();
      onDone();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={form.full_name} src={form.avatar_url} size="xl" />
        <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-bold dark:border-neutral-700">
          <Camera className="h-4 w-4" /> {uploading ? 'Uploading…' : form.avatar_url ? 'Change photo' : 'Add a photo'}
          <input id="profile-photo" type="file" accept="image/*" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
      </div>

      <Label label="Name" hint="Shown on start lists, results and the ranking.">
        <Input id="profile-name" required value={form.full_name} onChange={(e) => set('full_name', e.target.value)} autoComplete="name" />
      </Label>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-bold">What do you race?</legend>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINES.map((d) => {
            const on = form.disciplines.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(d)}
                className={cx('min-h-touch rounded-full border px-4 text-sm font-bold transition', on ? 'border-brand-black bg-brand-black text-brand-yellow dark:border-brand-yellow dark:bg-brand-yellow dark:text-brand-black' : 'border-neutral-300 dark:border-neutral-700')}
              >
                {d === 'Mountainbike' ? 'Mountain bike' : d}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Label label="Kit size" hint="Used by the team admins when ordering race kit.">
        <Select id="profile-size" value={form.tshirt_size ?? ''} onChange={(e) => set('tshirt_size', (e.target.value || null) as ProfileInput['tshirt_size'])}>
          <option value="">Not set</option>
          {TSHIRT_SIZES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </Label>

      <Label label="About you" hint={`${(form.bio ?? '').length}/280 · Goals, favourite race, how long you've been riding…`}>
        <Textarea id="profile-bio" maxLength={280} value={form.bio ?? ''} onChange={(e) => set('bio', e.target.value)} placeholder="e.g. Chasing a sub-5 at Ironman 70.3 Dubai" />
      </Label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Label label="Strava">
          <Input id="profile-strava" inputMode="url" value={form.strava_url ?? ''} onChange={(e) => set('strava_url', e.target.value)} placeholder="strava.com/athletes/…" />
        </Label>
        <Label label="Instagram">
          <Input id="profile-instagram" value={form.instagram ?? ''} onChange={(e) => set('instagram', e.target.value)} placeholder="@yourhandle" />
        </Label>
      </div>

      <ErrorNote error={error} />
      <div className="flex gap-2 pb-2">
        {onCancel && (
          <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" loading={save.isPending} disabled={uploading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
