import { useEffect, useMemo, useState } from 'react';
import { Camera, Check, Pencil, Trash2, Trophy, UserPlus } from 'lucide-react';
import { useDeleteResult, useProfiles, useRaces, useRegistrations, useResults, useSaveResultsBatch, type ResultRow } from '@/hooks/useData';
import { formatDate, formatShort, teamToday } from '@/lib/dates';
import type { RaceResult } from '@/lib/types';
import { ResultFormModal } from '@/components/ResultFormModal';
import { Button, ConfirmModal, EmptyState, ErrorNote, Input, Select, Spinner, cx } from '@/components/ui';

interface Line {
  key: string;
  id?: string;
  user_id: string | null;
  athlete_name: string;
  position: string;
  result_text: string;
  photos: number;
  registered: boolean;
  dirty: boolean;
}

const lineKey = (userId: string | null, name: string) => userId ?? `name:${name.trim().toLowerCase()}`;

export default function AdminResults() {
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const { data: results = [] } = useResults();
  const { data: profiles = [] } = useProfiles();
  const save = useSaveResultsBatch();
  const del = useDeleteResult();

  const today = teamToday();
  const past = useMemo(() => races.filter((r) => r.race_date <= today && r.status !== 'Cancelled').sort((a, b) => b.race_date.localeCompare(a.race_date)), [races, today]);
  const resultCount = useMemo(() => results.reduce<Record<string, number>>((m, r) => (r.race_id ? ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m) : m), {}), [results]);

  const [raceId, setRaceId] = useState('');
  useEffect(() => {
    if (!raceId && past.length) setRaceId(past[0].id);
  }, [past, raceId]);
  const race = races.find((r) => r.id === raceId);

  // Registered athletes + anyone with a result for this race.
  const [lines, setLines] = useState<Line[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!raceId) return;
    const map = new Map<string, Line>();
    for (const g of regs.filter((r) => r.race_id === raceId)) {
      map.set(lineKey(g.user_id, g.athlete_name), { key: lineKey(g.user_id, g.athlete_name), user_id: g.user_id, athlete_name: g.athlete_name, position: '', result_text: '', photos: 0, registered: true, dirty: false });
    }
    for (const r of results.filter((x) => x.race_id === raceId)) {
      const k = lineKey(r.user_id, r.athlete_name);
      map.set(k, {
        key: k,
        id: r.id,
        user_id: r.user_id,
        athlete_name: r.athlete_name,
        position: r.overall_position?.toString() ?? '',
        result_text: r.result_text ?? '',
        photos: r.photos.length,
        registered: map.get(k)?.registered ?? false,
        dirty: false,
      });
    }
    setLines([...map.values()].sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999) || a.athlete_name.localeCompare(b.athlete_name)));
  }, [raceId, regs, results]);
  useEffect(() => setSaved(false), [raceId]);

  const update = (key: string, patch: Partial<Line>) => {
    setSaved(false);
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch, dirty: true } : l)));
  };

  const [adder, setAdder] = useState('');
  const addAthlete = () => {
    if (!adder) return;
    const p = profiles.find((x) => x.id === adder);
    const name = p ? p.full_name : adder.replace(/^name:/, '');
    const k = lineKey(p?.id ?? null, name);
    if (!lines.some((l) => l.key === k)) setLines((ls) => [...ls, { key: k, user_id: p?.id ?? null, athlete_name: name, position: '', result_text: '', photos: 0, registered: false, dirty: true }]);
    setAdder('');
  };
  const [otherName, setOtherName] = useState('');

  const dirty = lines.filter((l) => l.dirty && (l.id || l.position || l.result_text.trim()));
  const duplicatePositions = useMemo(() => {
    const seen = new Map<string, number>();
    lines.forEach((l) => l.position && seen.set(l.position, (seen.get(l.position) ?? 0) + 1));
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([p]) => p));
  }, [lines]);

  const saveAll = () => {
    if (!race) return;
    const rows: ResultRow[] = dirty.map((l) => ({
      id: l.id,
      race_id: race.id,
      user_id: l.user_id,
      athlete_name: l.athlete_name,
      overall_position: l.position ? Number(l.position) : null,
      result_text: l.result_text.trim() || null,
      ...(l.id ? {} : { notes: null, photos: [] }),
    })) as ResultRow[];
    save.mutate(rows, { onSuccess: () => setSaved(true) });
  };

  const [editing, setEditing] = useState<RaceResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<RaceResult | null>(null);
  const resultById = (id?: string) => results.find((r) => r.id === id) ?? null;
  const notListed = profiles.filter((p) => !lines.some((l) => l.user_id === p.id));

  if (isLoading) return <Spinner />;
  if (!past.length) return <EmptyState icon={<Trophy className="h-8 w-8" />} title="No past races yet">Results can be entered once a race date has passed.</EmptyState>;

  return (
    <div className="space-y-4 pb-24 sm:pb-0">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Select id="admin-results-race" value={raceId} onChange={(e) => setRaceId(e.target.value)} aria-label="Race">
          {past.map((r) => (
            <option key={r.id} value={r.id}>
              {formatShort(r.race_date)} · {r.event_name} {resultCount[r.id] ? `(${resultCount[r.id]} results)` : '(no results yet)'}
            </option>
          ))}
        </Select>
        <Button variant="secondary" className="rounded-full" onClick={() => setAdding(true)}>
          <Camera className="h-4 w-4" /> Full recap with photos
        </Button>
      </div>

      {race && (
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <header className="flex flex-wrap items-end justify-between gap-2 border-b border-neutral-200 bg-brand-black px-4 py-3 text-white dark:border-neutral-800">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-yellow">Results entry</p>
              <h2 className="truncate text-lg font-extrabold">{race.event_name}</h2>
            </div>
            <p className="text-xs text-neutral-400">{formatDate(race.race_date)}</p>
          </header>

          {lines.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">Nobody registered for this race. Add athletes below.</p>
          ) : (
            <>
              <div className="hidden grid-cols-[1fr_96px_1.2fr_88px] gap-3 border-b border-neutral-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-neutral-500 dark:border-neutral-800 sm:grid">
                <span>Athlete</span>
                <span>Overall pos.</span>
                <span>Result / time</span>
                <span />
              </div>
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {lines.map((l) => {
                  const dup = !!l.position && duplicatePositions.has(l.position);
                  return (
                    <li key={l.key} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[1fr_96px_1.2fr_88px]">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{l.athlete_name}</p>
                        <p className="text-[11px] text-neutral-500">
                          {l.registered ? 'Registered' : 'Added by admin'}
                          {l.photos > 0 && ` · ${l.photos} photo${l.photos === 1 ? '' : 's'}`}
                          {l.dirty && <span className="font-bold text-amber-600 dark:text-amber-400"> · unsaved</span>}
                        </p>
                      </div>
                      <div className="flex justify-end gap-0.5 sm:order-last">
                        {l.id && (
                          <>
                            <button onClick={() => setEditing(resultById(l.id))} aria-label={`Edit ${l.athlete_name}'s recap`} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleting(resultById(l.id))} aria-label={`Delete ${l.athlete_name}'s result`} className="flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                      <label className="col-span-2 grid grid-cols-[96px_1fr] gap-2 sm:col-span-1 sm:block">
                        <span className="sr-only">Overall position for {l.athlete_name}</span>
                        <Input
                          id={`pos-${l.key}`}
                          inputMode="numeric"
                          type="number"
                          min={1}
                          placeholder="Pos."
                          value={l.position}
                          onChange={(e) => update(l.key, { position: e.target.value })}
                          className={cx('text-center font-bold tabular-nums', Number(l.position) >= 1 && Number(l.position) <= 3 && 'border-brand-black bg-brand-yellow text-brand-black dark:border-brand-yellow', dup && 'border-red-500 ring-2 ring-red-200')}
                        />
                        <Input
                          id={`res-${l.key}`}
                          placeholder="e.g. 2:31:05 · 1st AG 40–44"
                          value={l.result_text}
                          onChange={(e) => update(l.key, { result_text: e.target.value })}
                          className="sm:hidden"
                          aria-label={`Result for ${l.athlete_name}`}
                        />
                      </label>
                      <Input
                        id={`res-d-${l.key}`}
                        placeholder="e.g. 2:31:05 · 1st AG 40–44"
                        value={l.result_text}
                        onChange={(e) => update(l.key, { result_text: e.target.value })}
                        className="hidden sm:block"
                        aria-label={`Result for ${l.athlete_name}`}
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Add someone who raced but didn't register */}
          <div className="grid gap-2 border-t border-neutral-100 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-[1fr_auto]">
            <Select id="admin-results-add" value={adder} onChange={(e) => setAdder(e.target.value)} aria-label="Add athlete">
              <option value="">Add an athlete who isn't listed…</option>
              {notListed.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              {otherName.trim() && <option value={`name:${otherName.trim()}`}>“{otherName.trim()}” (guest)</option>}
            </Select>
            <Button variant="secondary" onClick={addAthlete} disabled={!adder} className="rounded-full">
              <UserPlus className="h-4 w-4" /> Add
            </Button>
            <Input id="admin-results-guest" value={otherName} onChange={(e) => setOtherName(e.target.value)} placeholder="Guest rider not in the app? Type their name, then pick it above" className="text-sm sm:col-span-2" />
          </div>
        </section>
      )}

      <ErrorNote error={save.error || del.error} />
      {duplicatePositions.size > 0 && <p className="text-sm font-semibold text-red-600">Two athletes share position {[...duplicatePositions].join(', ')}. Check before saving.</p>}
      <p className="text-xs text-neutral-500">Overall position drives the season ranking (1st = 3 pts, 2nd = 2, 3rd = 1). Age-group places go in the result text.</p>

      {/* Save bar: fixed above the tab bar on phones */}
      <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-neutral-500">
            {saved ? (
              <span className="flex items-center gap-1 font-bold text-green-700 dark:text-green-400">
                <Check className="h-4 w-4" /> Results saved
              </span>
            ) : dirty.length ? (
              `${dirty.length} change${dirty.length === 1 ? '' : 's'} to save`
            ) : (
              'No changes'
            )}
          </p>
          <Button onClick={saveAll} disabled={!dirty.length} loading={save.isPending} className="rounded-full px-6">
            Save results
          </Button>
        </div>
      </div>

      <ResultFormModal open={adding || !!editing} onClose={() => (setAdding(false), setEditing(null))} result={editing} defaultRaceId={raceId} />
      <ConfirmModal
        open={!!deleting}
        title="Delete result?"
        message={`${deleting?.athlete_name}'s result for ${deleting?.race_name}, including its photos, will be removed.`}
        loading={del.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
