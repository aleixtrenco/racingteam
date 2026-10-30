import { useEffect, useState, type FormEvent } from 'react';
import { DISCIPLINES, PRIORITIES, STATUSES, type Race } from '@/lib/types';
import { useSaveRace, type RaceInput } from '@/hooks/useData';
import { Button, ErrorNote, Input, Label, Modal, Select, Textarea } from './ui';

const blank: RaceInput = {
  event_name: '',
  race_date: '',
  end_date: null,
  location: '',
  status: 'Tentative',
  priority: 'Medium',
  discipline: 'Road',
  athletes_racing_note: '',
  team_entry_only: false,
  external_id: '',
};

/** `race` edits an existing race; `initial` prefills a new one (e.g. a duplicate). */
export function RaceFormModal({ open, onClose, race, initial }: { open: boolean; onClose: () => void; race?: Race | null; initial?: Race | null }) {
  const [form, setForm] = useState<RaceInput>(blank);
  const save = useSaveRace();

  useEffect(() => {
    if (open) {
      const { id: _id, ...rest } = race ?? initial ?? ({ id: '', ...blank } as Race);
      setForm(rest);
      save.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, race, initial]);

  const set = <K extends keyof RaceInput>(k: K, v: RaceInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await save.mutateAsync({
      ...form,
      id: race?.id,
      location: form.location?.trim() || null,
      athletes_racing_note: form.athletes_racing_note?.trim() || null,
      external_id: form.external_id?.trim() || null,
      end_date: form.end_date && form.end_date > form.race_date ? form.end_date : null,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={race ? 'Edit race' : 'Add race'}>
      <form onSubmit={submit} className="space-y-4">
        <Label label="Event name">
          <Input required value={form.event_name} onChange={(e) => set('event_name', e.target.value)} />
        </Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Label label="Date">
            <Input id="race-date" required type="date" value={form.race_date} onChange={(e) => set('race_date', e.target.value)} />
          </Label>
          <Label label="Last day (multi-day events)" hint="Leave empty for one-day races.">
            <Input id="race-end-date" type="date" min={form.race_date || undefined} value={form.end_date ?? ''} onChange={(e) => set('end_date', e.target.value || null)} />
          </Label>
        </div>
        <Label label="Location">
          <Input id="race-location" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
        </Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Label label="Discipline">
            <Select value={form.discipline} onChange={(e) => set('discipline', e.target.value as RaceInput['discipline'])}>
              {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Label>
          <Label label="Status">
            <Select value={form.status} onChange={(e) => set('status', e.target.value as RaceInput['status'])}>
              {STATUSES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Label>
          <Label label="Priority">
            <Select value={form.priority} onChange={(e) => set('priority', e.target.value as RaceInput['priority'])}>
              {PRIORITIES.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Label>
        </div>
        <Label label="Athletes racing note" hint="Shown on the race page, e.g. who is racing which distance.">
          <Textarea value={form.athletes_racing_note ?? ''} onChange={(e) => set('athletes_racing_note', e.target.value)} />
        </Label>
        <label className="flex min-h-touch items-center gap-3 rounded-xl border border-neutral-300 px-3 dark:border-neutral-700">
          <input type="checkbox" className="h-5 w-5 accent-black" checked={form.team_entry_only} onChange={(e) => set('team_entry_only', e.target.checked)} />
          <span className="text-sm">
            <span className="font-bold">Team entry only</span>
            <span className="block text-xs text-neutral-500">Athletes can't join individually; the team manager handles entry.</span>
          </span>
        </label>
        <Label label="External ID" hint="Optional reference from the organiser's system.">
          <Input value={form.external_id ?? ''} onChange={(e) => set('external_id', e.target.value)} />
        </Label>
        <ErrorNote error={save.error} />
        <div className="flex gap-2 pb-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={save.isPending}>
            {race ? 'Save changes' : 'Add race'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
