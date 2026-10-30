import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useRaces, useRegistrations, useResults } from '@/hooks/useData';
import { teamToday } from '@/lib/dates';
import { Button, Card, Select, Spinner } from '@/components/ui';

interface Row {
  athlete: string;
  email: string;
  total: number;
  upcoming: number;
  past: number;
  recaps: number;
}

export default function AdminAthletes() {
  const { data: regs = [], isLoading } = useRegistrations();
  const { data: races = [] } = useRaces();
  const { data: results = [] } = useResults();
  const thisYear = teamToday().slice(0, 4);
  const [year, setYear] = useState(thisYear);

  const years = useMemo(() => [...new Set([thisYear, ...regs.map((r) => r.race_date?.slice(0, 4)).filter(Boolean) as string[]])].sort().reverse(), [regs, thisYear]);

  const rows = useMemo(() => {
    const today = teamToday();
    const cancelled = new Set(races.filter((r) => r.status === 'Cancelled').map((r) => r.id));
    const map = new Map<string, Row>();
    for (const r of regs) {
      if (year !== 'all' && r.race_date?.slice(0, 4) !== year) continue;
      if (cancelled.has(r.race_id)) continue;
      const key = r.user_id ?? r.athlete_email ?? r.athlete_name;
      const row = map.get(key) ?? { athlete: r.athlete_name, email: r.athlete_email, total: 0, upcoming: 0, past: 0, recaps: 0 };
      row.total++;
      if (r.race_date && r.race_date >= today) row.upcoming++;
      else row.past++;
      if (results.some((x) => x.race_id === r.race_id && x.user_id && x.user_id === r.user_id)) row.recaps++;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => b.total - a.total || a.athlete.localeCompare(b.athlete));
  }, [regs, races, results, year]);

  const totals = rows.reduce((t, r) => ({ total: t.total + r.total, upcoming: t.upcoming + r.upcoming, past: t.past + r.past, recaps: t.recaps + r.recaps }), { total: 0, upcoming: 0, past: 0, recaps: 0 });

  const exportCsv = () => {
    const lines = [['Athlete', 'Email', 'Registrations', 'Upcoming', 'Completed', 'Recaps'], ...rows.map((r) => [r.athlete, r.email, r.total, r.upcoming, r.past, r.recaps])];
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `participation-${year}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 basis-full text-sm text-neutral-500 sm:flex-1 sm:basis-auto">
          <span className="font-bold text-brand-black dark:text-white">{rows.length} athletes</span> · {totals.total} registrations · {totals.recaps} recaps. Cancelled races are excluded.
        </p>
        <Select id="athletes-year" value={year} onChange={(e) => setYear(e.target.value)} className="!w-32 rounded-full" aria-label="Season">
          {years.map((y) => <option key={y}>{y}</option>)}
          <option value="all">All time</option>
        </Select>
        <Button variant="secondary" onClick={exportCsv} disabled={!rows.length} className="rounded-full">
          <Download className="h-4 w-4" /> CSV
        </Button>
      </div>
      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-neutral-500 dark:border-neutral-700">No registrations for this period.</p>
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="space-y-2 sm:hidden">
            {rows.map((r) => (
              <li key={r.email + r.athlete} className="rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{r.athlete}</p>
                    <p className="truncate text-xs text-neutral-500">{r.email}</p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-2xl font-extrabold leading-none tabular-nums">{r.total}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">races</span>
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[['Upcoming', r.upcoming], ['Completed', r.past], ['Recaps', r.recaps]].map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-neutral-50 py-2 dark:bg-neutral-950">
                      <dd className="font-extrabold tabular-nums">{v}</dd>
                      <dt className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{k}</dt>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
          {/* Larger screens: table */}
          <Card className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Athlete</th>
                  <th className="px-4 py-3 text-center">Registrations</th>
                  <th className="px-4 py-3 text-center">Upcoming</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Recaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {rows.map((r) => (
                  <tr key={r.email + r.athlete}>
                    <td className="px-4 py-2.5">
                      <p className="font-bold">{r.athlete}</p>
                      <p className="text-xs text-neutral-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-center text-base font-extrabold tabular-nums">{r.total}</td>
                    <td className="px-4 py-2.5 text-center tabular-nums">{r.upcoming}</td>
                    <td className="px-4 py-2.5 text-center tabular-nums">{r.past}</td>
                    <td className="px-4 py-2.5 text-center tabular-nums">{r.recaps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
