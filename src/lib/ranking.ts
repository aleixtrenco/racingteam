import type { RaceResult } from './types';

export const POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

export interface RankingRow {
  athlete: string;
  userId: string | null;
  points: number;
  races: number;
  wins: number;
  seconds: number;
  thirds: number;
}

/** Season standings from overall placings only: 1st = 3, 2nd = 2, 3rd = 1. Sorted by points, then races. */
export function seasonRanking(results: RaceResult[], year: number): RankingRow[] {
  const rows = new Map<string, RankingRow>();
  for (const r of results) {
    if (!r.race_date || Number(r.race_date.slice(0, 4)) !== year) continue;
    const name = r.athlete_name.trim();
    if (!name) continue;
    const key = r.user_id ?? name.toLowerCase();
    const row = rows.get(key) ?? { athlete: name, userId: r.user_id, points: 0, races: 0, wins: 0, seconds: 0, thirds: 0 };
    row.races += 1;
    const pos = r.overall_position ?? 0;
    row.points += POINTS[pos] ?? 0;
    if (pos === 1) row.wins++;
    if (pos === 2) row.seconds++;
    if (pos === 3) row.thirds++;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.races - a.races || a.athlete.localeCompare(b.athlete));
}

export const seasonsIn = (results: RaceResult[]) =>
  [...new Set(results.map((r) => r.race_date && Number(r.race_date.slice(0, 4))).filter(Boolean) as number[])].sort((a, b) => b - a);
