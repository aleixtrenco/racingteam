import type React from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, MapPin, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useDeleteRace, usePatchRace, useRaces, useRegistrations } from '@/hooks/useData';
import { raceIsUpcoming, teamToday } from '@/lib/dates';
import { DISCIPLINES, PRIORITIES, STATUSES, type Race, type RaceStatus } from '@/lib/types';
import { RaceFormModal } from '@/components/RaceFormModal';
import { BibDate } from '@/components/BibDate';
import { Badge, Button, ConfirmModal, DisciplineBadge, EmptyState, ErrorNote, Input, Select, Spinner, cx } from '@/components/ui';

const statusTone: Record<RaceStatus, string> = {
  Confirmed: 'bg-green-600 text-white',
  Tentative: 'bg-amber-400 text-brand-black',
  Cancelled: 'bg-red-600 text-white',
};

export default function AdminRaces() {
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const del = useDeleteRace();
  const patch = usePatchRace();
  const [editing, setEditing] = useState<Race | null>(null);
  const [draft, setDraft] = useState<Race | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Race | null>(null);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [q, setQ] = useState('');
  const [discipline, setDiscipline] = useState('All');

  const counts = useMemo(() => regs.reduce<Record<string, number>>((m, r) => ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m), {}), [regs]);
  const list = useMemo(() => {
    const today = teamToday();
    const needle = q.trim().toLowerCase();
    const l = races.filter(
      (r) =>
        raceIsUpcoming(r, today) === (view === 'upcoming') &&
        (discipline === 'All' || r.discipline === discipline) &&
        (!needle || `${r.event_name} ${r.location ?? ''}`.toLowerCase().includes(needle)),
    );
    return view === 'past' ? [...l].reverse() : l;
  }, [races, view, q, discipline]);

  const deletingCount = deleting ? (counts[deleting.id] ?? 0) : 0;
  const closeForm = () => {
    setAdding(false);
    setEditing(null);
    setDraft(null);
  };
  // "Duplicate" opens the add form prefilled (e.g. next round of a series).
  const duplicate = (r: Race) => {
    setDraft({ ...r, id: '', event_name: `${r.event_name} (copy)`, external_id: null });
    setAdding(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full bg-neutral-200/70 p-1 dark:bg-neutral-800">
          {(['upcoming', 'past'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cx('min-h-[36px] rounded-full px-4 text-sm font-bold capitalize transition', view === v ? 'bg-white shadow dark:bg-neutral-950' : 'text-neutral-600 dark:text-neutral-400')}>
              {v}
            </button>
          ))}
        </div>
        <Button onClick={() => setAdding(true)} className="ml-auto rounded-full">
          <Plus className="h-4 w-4" /> Add race
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
        <label className="relative block">
          <span className="sr-only">Search races</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input id="admin-race-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or location" className="pl-9" />
        </label>
        <Select id="admin-race-discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} aria-label="Discipline">
          <option value="All">All disciplines</option>
          {DISCIPLINES.map((d) => <option key={d}>{d}</option>)}
        </Select>
      </div>

      <ErrorNote error={del.error || patch.error} />

      {isLoading ? (
        <Spinner />
      ) : list.length === 0 ? (
        <EmptyState title={`No ${view} races${q || discipline !== 'All' ? ' match' : ''}`}>
          {view === 'upcoming' && (
            <button onClick={() => setAdding(true)} className="font-bold underline">
              Add the first one
            </button>
          )}
        </EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => (
            <li key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 sm:p-4">
              <div className="flex gap-3">
                <BibDate date={r.race_date} muted={r.status === 'Cancelled'} />
                <div className="min-w-0 flex-1">
                  <Link to={`/races/${r.id}`} className="block truncate font-bold hover:underline">
                    {r.event_name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                    {r.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {counts[r.id] ?? 0} registered
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <DisciplineBadge discipline={r.discipline} />
                    {r.team_entry_only && <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-black">Team entry</Badge>}
                  </div>
                </div>
              </div>

              {/* Quick edits */}
              <div className="mt-3 grid gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center">
                <div className="flex rounded-full bg-neutral-100 p-0.5 dark:bg-neutral-800" role="radiogroup" aria-label={`Status of ${r.event_name}`}>
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      role="radio"
                      aria-checked={r.status === st}
                      onClick={() => r.status !== st && patch.mutate({ id: r.id, status: st })}
                      className={cx('min-h-[36px] flex-1 rounded-full px-3 text-xs font-bold transition', r.status === st ? statusTone[st] : 'text-neutral-500 hover:text-brand-black dark:hover:text-white')}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <Select
                  id={`priority-${r.id}`}
                  aria-label={`Priority of ${r.event_name}`}
                  value={r.priority}
                  onChange={(e) => patch.mutate({ id: r.id, priority: e.target.value as Race['priority'] })}
                  className="!min-h-[40px] rounded-full text-sm sm:w-40"
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
                </Select>
                <div className="flex items-center justify-between gap-2 sm:contents">
                  <label className="flex min-h-[40px] items-center gap-2 text-sm sm:justify-self-end">
                    <input type="checkbox" className="h-5 w-5 accent-black" checked={r.team_entry_only} onChange={(e) => patch.mutate({ id: r.id, team_entry_only: e.target.checked })} />
                    Team entry only
                  </label>
                  <div className="flex shrink-0">
                    <IconBtn label={`Edit ${r.event_name}`} onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label={`Duplicate ${r.event_name}`} onClick={() => duplicate(r)}>
                      <Copy className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn label={`Delete ${r.event_name}`} danger onClick={() => setDeleting(r)}>
                      <Trash2 className="h-4 w-4" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!deleting}
        title="Delete race?"
        message={`"${deleting?.event_name}" will be removed${deletingCount ? ` along with ${deletingCount} registration${deletingCount === 1 ? '' : 's'}` : ''}. Results already posted are kept. This can't be undone.`}
        loading={del.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
      <RaceFormModal open={adding || !!editing} onClose={closeForm} race={editing} initial={draft} />
    </div>
  );
}

const IconBtn = ({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={cx('flex h-10 w-10 items-center justify-center rounded-full transition', danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800')}
  >
    {children}
  </button>
);
