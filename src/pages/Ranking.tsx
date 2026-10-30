import { useMemo, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { useResults } from '@/hooks/useData';
import { seasonRanking, seasonsIn } from '@/lib/ranking';
import { teamToday } from '@/lib/dates';
import { Card, EmptyState, PageHeader, Select, Spinner, cx } from '@/components/ui';

export default function Ranking() {
  const { data: results = [], isLoading } = useResults();
  const thisYear = Number(teamToday().slice(0, 4));
  const seasons = useMemo(() => [...new Set([thisYear, ...seasonsIn(results)])].sort((a, b) => b - a), [results, thisYear]);
  const [year, setYear] = useState(thisYear);
  const rows = useMemo(() => seasonRanking(results, year), [results, year]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Season ranking"
        subtitle="Overall placings only: 1st = 3 pts · 2nd = 2 pts · 3rd = 1 pt. Ties broken by races completed."
        action={
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-32" aria-label="Season">
            {seasons.map((y) => <option key={y}>{y}</option>)}
          </Select>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Trophy className="h-8 w-8" />} title={`No results for ${year} yet`} />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-black text-left text-xs uppercase tracking-wide text-white">
              <tr>
                <th className="w-12 px-3 py-3 text-center">#</th>
                <th className="px-3 py-3">Athlete</th>
                <th className="hidden px-3 py-3 text-center sm:table-cell">🥇 🥈 🥉</th>
                <th className="px-3 py-3 text-center">Races</th>
                <th className="px-3 py-3 text-right text-brand-yellow">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {rows.map((r, i) => (
                <tr key={r.athlete} className={cx(i < 3 && r.points > 0 && 'bg-brand-yellow/10')}>
                  <td className="px-3 py-3 text-center font-extrabold">
                    {i < 3 && r.points > 0 ? <Medal className={cx('mx-auto h-5 w-5', ['text-amber-500', 'text-neutral-400', 'text-orange-700'][i])} /> : i + 1}
                  </td>
                  <td className="px-3 py-3 font-bold">{r.athlete}</td>
                  <td className="hidden px-3 py-3 text-center text-neutral-500 sm:table-cell">
                    {r.wins} · {r.seconds} · {r.thirds}
                  </td>
                  <td className="px-3 py-3 text-center">{r.races}</td>
                  <td className="px-3 py-3 text-right text-base font-extrabold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
