import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteRace, useRaces, useRegistrations } from '@/hooks/useData';
import { formatDate, isUpcoming, teamToday } from '@/lib/dates';
import type { Race } from '@/lib/types';
import { RaceFormModal } from '@/components/RaceFormModal';
import { Badge, Button, Card, DisciplineBadge, ErrorNote, PageHeader, Spinner, StatusBadge, cx } from '@/components/ui';

export default function Admin() {
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const del = useDeleteRace();
  const [editing, setEditing] = useState<Race | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  const counts = useMemo(() => regs.reduce<Record<string, number>>((m, r) => ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m), {}), [regs]);
  const list = useMemo(() => {
    const today = teamToday();
    const l = races.filter((r) => isUpcoming(r.race_date, today) === (view === 'upcoming'));
    return view === 'past' ? l.reverse() : l;
  }, [races, view]);

  const remove = (r: Race) => {
    const n = counts[r.id] ?? 0;
    if (confirm(`Delete "${r.event_name}"?${n ? ` This also removes ${n} registration${n === 1 ? '' : 's'}.` : ''}`)) del.mutate(r.id);
  };

  return (
    <div>
      <PageHeader
        title="Race management"
        subtitle={`${races.length} races in total`}
        action={
          <div className="flex gap-2">
            <Link to="/admin/participation" className="inline-flex min-h-touch items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-bold dark:border-neutral-700">
              <BarChart3 className="h-4 w-4" /> Participation
            </Link>
            <Button onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add race
            </Button>
          </div>
        }
      />
      <ErrorNote error={del.error} />

      <div className="mb-4 inline-flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {(['upcoming', 'past'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cx('min-h-[40px] rounded-lg px-4 text-sm font-bold capitalize', view === v && 'bg-white shadow dark:bg-neutral-950')}>
            {v}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3 text-center">Athletes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2">{formatDate(r.race_date)}</td>
                  <td className="px-4 py-2">
                    <Link to={`/races/${r.id}`} className="font-bold hover:underline">
                      {r.event_name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      <DisciplineBadge discipline={r.discipline} />
                      {r.team_entry_only && <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-black">Team entry</Badge>}
                      {r.location && <span className="text-xs text-neutral-500">{r.location}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-2">{r.priority}</td>
                  <td className="px-4 py-2 text-center font-bold">{counts[r.id] ?? 0}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-right">
                    <button onClick={() => setEditing(r)} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={`Edit ${r.event_name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(r)} className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950" aria-label={`Delete ${r.event_name}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                    No {view} races.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <RaceFormModal open={adding || !!editing} onClose={() => (setAdding(false), setEditing(null))} race={editing} />
    </div>
  );
}
