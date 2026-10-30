import { describe, expect, it } from 'vitest';
import { daysToDeadline, deadlineLabel, isRegistrationOpen, registrationDeadline, teamToday } from './dates';
import { seasonRanking } from './ranking';
import type { RaceResult } from './types';

describe('registration deadline', () => {
  it('closes 3 days before the race', () => {
    expect(registrationDeadline('2026-11-08')).toBe('2026-11-05');
    expect(isRegistrationOpen('2026-11-08', '2026-11-05')).toBe(true);
    expect(isRegistrationOpen('2026-11-08', '2026-11-06')).toBe(false);
  });
  it('labels the countdown', () => {
    expect(deadlineLabel('2026-11-08', '2026-11-05')).toBe('Closes today');
    expect(deadlineLabel('2026-11-08', '2026-11-04')).toBe('Closes tomorrow');
    expect(daysToDeadline('2026-11-08', '2026-11-01')).toBe(4);
    expect(deadlineLabel('2026-11-08', '2026-11-07')).toBe('Registration closed');
  });
  it('uses Dubai time for "today"', () => {
    // 21:00 UTC on 30 Oct is already 31 Oct in Dubai (UTC+4)
    expect(teamToday(new Date('2026-10-30T21:00:00Z'))).toBe('2026-10-31');
  });
});

const res = (athlete_name: string, overall_position: number | null, race_date = '2026-05-01'): RaceResult => ({
  id: Math.random().toString(), race_id: null, race_name: 'R', race_date, user_id: null, athlete_name,
  overall_position, result_text: null, notes: null, photos: [], created_at: '',
});

describe('season ranking', () => {
  it('scores overall podiums 3/2/1 and sorts by points then races', () => {
    const rows = seasonRanking(
      [res('Ana', 1), res('Ben', 2), res('Ben', 2), res('Cy', 3), res('Cy', 12), res('Dee', 1, '2025-05-01')],
      2026,
    );
    expect(rows.map((r) => [r.athlete, r.points, r.races])).toEqual([
      ['Ben', 4, 2],
      ['Ana', 3, 1],
      ['Cy', 1, 2],
    ]);
  });
  it('breaks point ties by number of races', () => {
    const rows = seasonRanking([res('Ana', 1), res('Ben', 1), res('Ben', 20)], 2026);
    expect(rows[0].athlete).toBe('Ben');
  });
});

describe('multi-day races', () => {
  it('formats date ranges', async () => {
    const { formatRaceDates } = await import('./dates');
    expect(formatRaceDates({ race_date: '2026-11-12', end_date: '2026-11-15' })).toBe('12–15 Nov 2026');
    expect(formatRaceDates({ race_date: '2027-01-30', end_date: '2027-02-01' })).toBe('30 Jan – 1 Feb 2027');
    expect(formatRaceDates({ race_date: '2026-10-04', end_date: null })).toBe('Sun, 4 Oct 2026');
  });
  it('stays upcoming until the last day', async () => {
    const { raceIsUpcoming } = await import('./dates');
    expect(raceIsUpcoming({ race_date: '2026-11-13', end_date: '2026-11-22' }, '2026-11-20')).toBe(true);
    expect(raceIsUpcoming({ race_date: '2026-11-13', end_date: '2026-11-22' }, '2026-11-23')).toBe(false);
  });
});
