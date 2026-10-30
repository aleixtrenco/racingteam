import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, Users } from 'lucide-react';
import type { Race } from '@/lib/types';
import { daysToDeadline, deadlineLabel, isRegistrationOpen } from '@/lib/dates';
import { BibDate } from './BibDate';
import { Badge, DisciplineBadge, PriorityBadge, StatusBadge, cx } from './ui';

export function RaceRow({ race, registeredCount, isMine, action }: { race: Race; registeredCount?: number; isMine?: boolean; action?: ReactNode }) {
  const cancelled = race.status === 'Cancelled';
  const open = !cancelled && !race.team_entry_only && isRegistrationOpen(race.race_date);
  const urgent = open && !isMine && daysToDeadline(race.race_date) <= 3;
  return (
    <div className="flex min-w-0 items-stretch gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 hover:shadow-lift dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
      <Link to={`/races/${race.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <BibDate date={race.race_date} active={isMine} muted={cancelled} />
        <div className="min-w-0 flex-1">
          <p className={cx('truncate text-[15px] font-bold leading-snug', cancelled && 'line-through opacity-60')}>{race.event_name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
            {race.location && (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{race.location}</span>
              </>
            )}
            {!!registeredCount && (
              <span className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
                <Users className="h-3 w-3" />
                {registeredCount}
              </span>
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <DisciplineBadge discipline={race.discipline} />
            {race.status !== 'Confirmed' && <StatusBadge status={race.status} />}
            <PriorityBadge priority={race.priority} />
            {race.team_entry_only && <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-black">Team entry</Badge>}
            {isMine && <Badge className="bg-brand-black text-brand-yellow dark:bg-brand-yellow dark:text-brand-black">You're in</Badge>}
            {open && !isMine && <span className={cx('text-[11px] font-semibold', urgent ? 'text-red-600 dark:text-red-400' : 'text-neutral-500')}>{deadlineLabel(race.race_date)}</span>}
          </div>
        </div>
        {!action && <ChevronRight className="h-5 w-5 shrink-0 text-neutral-300 dark:text-neutral-600" />}
      </Link>
      {action && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}
