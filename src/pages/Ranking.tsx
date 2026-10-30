import { useMemo, useState } from 'react';
import { Medal, Trophy } from 'lucide-react';
import { useResults } from '@/hooks/useData';
import { seasonRanking, seasonsIn, type RankingRow } from '@/lib/ranking';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { useProfileMap } from '@/hooks/useData';
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
        <div className="space-y-5">
        <Podium rows={rows.filter((r) => r.points > 0).slice(0, 3)} />
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
                  <td className="px-3 py-3 font-bold">
                    <AthleteLink row={r} />
                  </td>
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
        </div>
      )}
    </div>
  );
}

/** Season podium: 2nd · 1st · 3rd, step heights like the real thing. */
function Podium({ rows }: { rows: RankingRow[] }) {
  const people = useProfileMap();
  if (!rows.length) return null;
  const order = [1, 0, 2].filter((i) => rows[i]);
  const step = ['h-28 sm:h-32', 'h-20 sm:h-24', 'h-14 sm:h-16'];
  return (
    <section aria-label="Season podium" className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {order.map((i) => {
        const r = rows[i];
        return (
          <div key={r.athlete} className="flex min-w-0 flex-col items-center text-center">
            <Link to={r.userId ? `/athletes/${r.userId}` : '#'} className="mb-2">
              <Avatar name={r.athlete} src={r.userId ? people.get(r.userId)?.avatar_url : null} size="md" tone={i === 0 ? 'yellow' : 'muted'} className={i === 0 ? 'ring-4 ring-brand-yellow/40' : ''} />
            </Link>
            <p className="w-full truncate px-1 text-sm font-bold">{r.athlete}</p>
            <p className="mb-2 text-xs tabular-nums text-neutral-500">{r.points} pts</p>
            <div className={cx('flex w-full items-start justify-center rounded-t-2xl pt-2 text-3xl font-extrabold tabular-nums', step[i], i === 0 ? 'bg-brand-black text-brand-yellow dark:bg-brand-yellow dark:text-brand-black' : 'bg-white text-brand-black ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800')}>
              {i + 1}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function AthleteLink({ row }: { row: RankingRow }) {
  const people = useProfileMap();
  const content = (
    <span className="flex items-center gap-2.5">
      <Avatar name={row.athlete} src={row.userId ? people.get(row.userId)?.avatar_url : null} size="xs" tone="muted" />
      <span className="truncate">{row.athlete}</span>
    </span>
  );
  return row.userId ? (
    <Link to={`/athletes/${row.userId}`} className="hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}
