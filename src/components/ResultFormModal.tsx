import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { RaceResult } from '@/lib/types';
import { formatShort, teamToday } from '@/lib/dates';
import { useAuth } from '@/hooks/useAuth';
import { PHOTO_BUCKET, uploadPhotos, useProfiles, useRaces, useSaveResult, useSignedUrls } from '@/hooks/useData';
import { Button, ErrorNote, Input, Label, Modal, Select, Textarea } from './ui';

const MAX_PHOTOS = 8;

export function ResultFormModal({ open, onClose, result, defaultRaceId }: { open: boolean; onClose: () => void; result?: RaceResult | null; defaultRaceId?: string }) {
  const { profile, isAdmin } = useAuth();
  const { data: races = [] } = useRaces();
  const { data: profiles = [] } = useProfiles(isAdmin);
  const save = useSaveResult();

  const [raceId, setRaceId] = useState('');
  const [athlete, setAthlete] = useState('');
  // Admins pick a team member (links the result to their account) or type a guest's name.
  const [athleteId, setAthleteId] = useState<string>('');
  const [position, setPosition] = useState('');
  const [resultText, setResultText] = useState('');
  const [notes, setNotes] = useState('');
  const [kept, setKept] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!open) return;
    setRaceId(result?.race_id ?? defaultRaceId ?? '');
    setAthlete(result?.athlete_name ?? profile?.full_name ?? '');
    setAthleteId(result ? (result.user_id ?? 'guest') : (profile?.id ?? ''));
    setPosition(result?.overall_position?.toString() ?? '');
    setResultText(result?.result_text ?? '');
    setNotes(result?.notes ?? '');
    setKept(result?.photos ?? []);
    setFiles([]);
    setError(null);
  }, [open, result, defaultRaceId, profile]);

  // Past (and today's) races, newest first.
  const pastRaces = useMemo(() => {
    const today = teamToday();
    return races.filter((r) => r.race_date <= today && r.status !== 'Cancelled').sort((a, b) => b.race_date.localeCompare(a.race_date));
  }, [races]);

  const { data: urls = {} } = useSignedUrls(kept);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = files.length ? await uploadPhotos(profile.id, files) : [];
      const picked = profiles.find((p) => p.id === athleteId);
      const name = isAdmin && picked ? picked.full_name : athlete.trim();
      const userId = isAdmin ? (picked?.id ?? null) : result ? result.user_id : profile.id;
      await save.mutateAsync({
        id: result?.id,
        race_id: raceId,
        athlete_name: name,
        overall_position: position ? Number(position) : null,
        result_text: resultText.trim() || null,
        notes: notes.trim() || null,
        photos: [...kept, ...uploaded],
        // Athletes always own their entries; admins choose whose result it is.
        user_id: userId,
      });
      const removed = (result?.photos ?? []).filter((p) => !kept.includes(p));
      if (removed.length) await supabase.storage.from(PHOTO_BUCKET).remove(removed);
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const total = kept.length + files.length;

  return (
    <Modal open={open} onClose={onClose} title={result ? 'Edit result' : 'Add your result'}>
      <form onSubmit={submit} className="space-y-4">
        <Label label="Race">
          <Select required value={raceId} onChange={(e) => setRaceId(e.target.value)}>
            <option value="" disabled>
              Choose a race…
            </option>
            {pastRaces.map((r) => (
              <option key={r.id} value={r.id}>
                {formatShort(r.race_date)} · {r.event_name}
              </option>
            ))}
          </Select>
        </Label>
        {isAdmin ? (
          <div className="grid gap-2">
            <Label label="Athlete">
              <Select id="result-athlete" required value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
                <option value="" disabled>
                  Choose an athlete…
                </option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
                <option value="guest">Guest rider (not in the app)</option>
              </Select>
            </Label>
            {athleteId === 'guest' && <Input id="result-guest" required value={athlete} onChange={(e) => setAthlete(e.target.value)} placeholder="Guest rider's name" aria-label="Guest rider's name" />}
          </div>
        ) : (
          <Label label="Athlete">
            <Input value={athlete} readOnly className="opacity-70" />
          </Label>
        )}
        <Label label="Overall position" hint="Your place in the overall classification, not your age group. Used for the season ranking. Leave blank if DNF / not classified.">
          <Input type="number" inputMode="numeric" min={1} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="e.g. 3" />
        </Label>
        <Label label="Result" hint="Time, age-group place, distance… anything worth recording.">
          <Input value={resultText} onChange={(e) => setResultText(e.target.value)} placeholder="e.g. 2:31:05 · 1st AG 40–44" />
        </Label>
        <Label label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it go?" />
        </Label>

        <div className="space-y-2">
          <span className="text-sm font-bold">Photos</span>
          <div className="grid grid-cols-4 gap-2">
            {kept.map((p) => (
              <Thumb key={p} src={urls[p]} onRemove={() => setKept((k) => k.filter((x) => x !== p))} />
            ))}
            {previews.map((src, i) => (
              <Thumb key={src} src={src} onRemove={() => setFiles((f) => f.filter((_, j) => j !== i))} />
            ))}
            {total < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 text-xs text-neutral-500 dark:border-neutral-700">
                <ImagePlus className="h-6 w-6" />
                Add
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setFiles((f) => [...f, ...picked].slice(0, MAX_PHOTOS - kept.length));
                    e.target.value = '';
                  }}
                />
              </label>
            )}
          </div>
        </div>

        <ErrorNote error={error} />
        <div className="flex gap-2 pb-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={busy}>
            {result ? 'Save changes' : 'Add result'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const Thumb = ({ src, onRemove }: { src?: string; onRemove: () => void }) => (
  <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
    {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    <button type="button" onClick={onRemove} className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center" aria-label="Remove photo">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white">
        <X className="h-3.5 w-3.5" />
      </span>
    </button>
  </div>
);
