import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useRaces, useRegistrations, useResults } from '@/hooks/useData';
import { teamToday } from '@/lib/dates';
import { Button, Card, PageHeader, Select, Spinner } from '@/components/ui';

interface Row {
  athlete: string;
  email: string;
  total: number;
  upcoming: number;
  past: number;
  recaps: number;
}

export default function Participation() {
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
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Participation summary"
        subtitle={`${rows.length} athletes · ${totals.total} registrations (cancelled races excluded)`}
        action={
          <div className="flex gap-2">
            <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-32" aria-label="Season">
              {years.map((y) => <option key={y}>{y}</option>)}
              <option value="all">All time</option>
            </Select>
            <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>
              <Download className="h-4 w-4" /> CSV
            </Button>
          </div>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
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
                  <td className="px-4 py-2">
                    <p className="font-bold">{r.athlete}</p>
                    <p className="text-xs text-neutral-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-2 text-center text-base font-extrabold">{r.total}</td>
                  <td className="px-4 py-2 text-center">{r.upcoming}</td>
                  <td className="px-4 py-2 text-center">{r.past}</td>
                  <td className="px-4 py-2 text-center">{r.recaps}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    No registrations for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
