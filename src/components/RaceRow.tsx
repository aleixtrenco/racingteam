import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users } from 'lucide-react';
import type { Race } from '@/lib/types';
import { dayOfMonth, deadlineLabel, isRegistrationOpen, monthAbbr } from '@/lib/dates';
import { Badge, DisciplineBadge, PriorityBadge, StatusBadge, cx } from './ui';

export function RaceRow({ race, registeredCount, isMine, action }: { race: Race; registeredCount?: number; isMine?: boolean; action?: ReactNode }) {
  const cancelled = race.status === 'Cancelled';
  return (
    <div className="flex min-w-0 items-stretch gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <Link to={`/races/${race.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className={cx('flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl', isMine ? 'bg-brand-yellow text-brand-black' : 'bg-neutral-100 dark:bg-neutral-800')}>
          <span className="text-xl font-extrabold leading-none">{dayOfMonth(race.race_date)}</span>
          <span className="text-[11px] font-bold uppercase">{monthAbbr(race.race_date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={cx('truncate font-bold', cancelled && 'line-through opacity-60')}>{race.event_name}</p>
          {race.location && (
            <p className="flex items-center gap-1 truncate text-xs text-neutral-500">
              <MapPin className="h-3 w-3 shrink-0" />
              {race.location}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <StatusBadge status={race.status} />
            <DisciplineBadge discipline={race.discipline} />
            <PriorityBadge priority={race.priority} />
            {race.team_entry_only && <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-black">Team entry</Badge>}
            {isMine && <Badge className="bg-brand-black text-brand-yellow dark:bg-brand-yellow dark:text-brand-black">You're in</Badge>}
            {!cancelled && !race.team_entry_only && !isMine && isRegistrationOpen(race.race_date) && (
              <span className="text-[11px] text-neutral-500">{deadlineLabel(race.race_date)}</span>
            )}
            {!!registeredCount && (
              <span className="flex items-center gap-0.5 text-[11px] text-neutral-500">
                <Users className="h-3 w-3" />
                {registeredCount}
              </span>
            )}
          </div>
        </div>
        {!action && <ChevronRight className="h-5 w-5 shrink-0 text-neutral-400" />}
      </Link>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}
