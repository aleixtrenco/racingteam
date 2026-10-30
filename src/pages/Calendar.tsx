import { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useRegistrations } from '@/hooks/useData';
import { formatMonth, raceIsUpcoming, teamToday } from '@/lib/dates';
import { DISCIPLINES, STATUSES } from '@/lib/types';
import { RaceRow } from '@/components/RaceRow';
import { EmptyState, PageHeader, Select, Spinner, cx } from '@/components/ui';

export default function Calendar() {
  const { profile } = useAuth();
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const [discipline, setDiscipline] = useState('All');
  const [status, setStatus] = useState('All');

  const { months, mine, counts, total } = useMemo(() => {
    const today = teamToday();
    const filtered = races.filter(
      (r) => raceIsUpcoming(r, today) && (discipline === 'All' || r.discipline === discipline) && (status === 'All' || r.status === status),
    );
    const months = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const key = r.race_date.slice(0, 7);
      months.set(key, [...(months.get(key) ?? []), r]);
    }
    return {
      months: [...months.entries()],
      total: filtered.length,
      mine: new Set(regs.filter((r) => r.user_id === profile?.id).map((r) => r.race_id)),
      counts: regs.reduce<Record<string, number>>((m, r) => ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m), {}),
    };
  }, [races, regs, profile, discipline, status]);

  return (
    <div>
      <PageHeader title="Race calendar" subtitle={`${total} upcoming race${total === 1 ? '' : 's'}`} />

      <div className="mb-5 space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {['All', ...DISCIPLINES].map((d) => (
            <button
              key={d}
              onClick={() => setDiscipline(d)}
              className={cx(
                'min-h-touch shrink-0 rounded-full border px-4 text-sm font-bold',
                discipline === d ? 'border-brand-black bg-brand-black text-white dark:border-brand-yellow dark:bg-brand-yellow dark:text-brand-black' : 'border-neutral-300 dark:border-neutral-700',
              )}
            >
              {d === 'All' ? 'All disciplines' : d}
            </button>
          ))}
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full sm:ml-auto sm:w-48" aria-label="Filter by status">
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : months.length === 0 ? (
        <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No races match these filters" />
      ) : (
        <div className="space-y-8">
          {months.map(([month, list]) => (
            <section key={month}>
              <h2 className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-10 -mx-4 mb-3 bg-neutral-50/95 px-4 py-2 text-sm font-extrabold uppercase tracking-widest text-neutral-500 backdrop-blur dark:bg-brand-black/95">
                {formatMonth(`${month}-01`)}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {list.map((r) => <RaceRow key={r.id} race={r} isMine={mine.has(r.id)} registeredCount={counts[r.id]} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
