import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useRaces, useRegistrations, useResults } from './useData';
import { DEADLINE_WARNING_DAYS, daysBetween, daysToDeadline, deadlineLabel, formatShort, teamToday } from '@/lib/dates';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: 'deadline' | 'recap' | 'info';
}

/** In-app notifications derived from data: closing deadlines, upcoming races you're in, recaps to add. */
export function useNotifications(): AppNotification[] {
  const { profile } = useAuth();
  const { data: races = [] } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const { data: results = [] } = useResults();

  return useMemo(() => {
    if (!profile) return [];
    const today = teamToday();
    const mine = new Set(regs.filter((r) => r.user_id === profile.id).map((r) => r.race_id));
    const recapped = new Set(results.filter((r) => r.user_id === profile.id).map((r) => r.race_id));
    const out: AppNotification[] = [];

    for (const race of races) {
      if (race.status === 'Cancelled') continue;
      const dl = daysToDeadline(race.race_date, today);
      if (!mine.has(race.id) && !race.team_entry_only && dl >= 0 && dl <= DEADLINE_WARNING_DAYS) {
        out.push({ id: `dl-${race.id}`, tone: 'deadline', href: `/races/${race.id}`, title: race.event_name, body: `Registration ${deadlineLabel(race.race_date, today).toLowerCase()}` });
      }
      const until = daysBetween(today, race.race_date);
      if (mine.has(race.id) && until >= 0 && until <= 7) {
        out.push({ id: `soon-${race.id}`, tone: 'info', href: `/races/${race.id}`, title: race.event_name, body: until === 0 ? 'Race day today. Good luck!' : `You race on ${formatShort(race.race_date)}` });
      }
      if (mine.has(race.id) && !recapped.has(race.id) && until < 0 && until >= -14) {
        out.push({ id: `recap-${race.id}`, tone: 'recap', href: `/results?add=${race.id}`, title: race.event_name, body: 'How did it go? Add your result and photos.' });
      }
    }
    return out;
  }, [profile, races, regs, results]);
}
