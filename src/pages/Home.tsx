import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock, Flag, ListChecks, MapPin } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useRegistrations } from '@/hooks/useData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { formatRaceDates, DEADLINE_WARNING_DAYS, daysBetween, daysToDeadline, deadlineLabel, formatShort, isRegistrationOpen, raceIsUpcoming, teamToday } from '@/lib/dates';
import type { Race } from '@/lib/types';
import { Logo } from '@/components/Logo';
import { RaceRow } from '@/components/RaceRow';
import { SponsorStrip } from '@/components/SponsorStrip';
import { DisciplineBadge, EmptyState, PullIndicator, Spinner, cx } from '@/components/ui';

const BASE = import.meta.env.BASE_URL;
const hideParentOnError = (e: React.SyntheticEvent<HTMLImageElement>) => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none');

export default function Home() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const ptr = usePullToRefresh(() => qc.invalidateQueries());

  const s = useMemo(() => {
    const today = teamToday();
    const upcoming = races.filter((r) => raceIsUpcoming(r, today) && r.status !== 'Cancelled');
    const mine = new Set(regs.filter((r) => r.user_id === profile?.id).map((r) => r.race_id));
    const countByRace = regs.reduce<Record<string, number>>((m, r) => ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m), {});
    const deadlines = upcoming.filter((r) => {
      const d = daysToDeadline(r.race_date, today);
      return !r.team_entry_only && !mine.has(r.id) && d >= 0 && d <= DEADLINE_WARNING_DAYS;
    });
    const myNext = upcoming.find((r) => mine.has(r.id));
    return {
      upcoming,
      mine,
      countByRace,
      deadlines,
      spotlight: myNext ?? upcoming[0],
      spotlightIsMine: !!myNext,
      myUpcoming: upcoming.filter((r) => mine.has(r.id)).length,
      confirmed: upcoming.filter((r) => r.status === 'Confirmed').length,
    };
  }, [races, regs, profile]);

  const firstName = profile?.full_name.split(' ')[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />

      {/* Hero: who you are + the race that matters next */}
      <section className="relative -mx-4 -mt-5 overflow-hidden bg-brand-black text-white sm:mx-0 sm:mt-0 sm:rounded-[28px]">
        {/* Kit sash */}
        <div aria-hidden className="absolute -right-8 top-0 h-full w-[64px] skew-x-[-10deg] bg-brand-yellow sm:-right-16 sm:w-[38%] sm:skew-x-[-18deg]" />
        <div aria-hidden className="absolute -right-8 top-0 h-full w-[64px] -translate-x-[22px] skew-x-[-10deg] border-l-[6px] border-white/90 sm:-right-16 sm:w-[38%] sm:-translate-x-[34px] sm:skew-x-[-18deg] sm:border-l-[10px]" />
        <img
          src={`${BASE}brand/hero.jpg`}
          alt=""
          fetchPriority="high"
          decoding="async"
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="relative grid gap-6 px-5 pb-6 pt-7 sm:grid-cols-[1.1fr_1fr] sm:items-end sm:gap-10 sm:p-10">
          <div className="min-w-0 pr-12 sm:pr-0">
            <Logo white className="hidden h-16 sm:block" />
            <h1 className="text-balance sm:mt-6 text-[32px] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              {firstName ? (
                <>
                  Ready to race,
                  <br />
                  <span className="text-brand-yellow">{firstName}?</span>
                </>
              ) : (
                'Ready to race?'
              )}
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutral-300">Find your next race, sign up in one tap and share your results with the team.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link to="/calendar" className="inline-flex min-h-touch items-center gap-2 rounded-full bg-brand-yellow px-5 text-[15px] font-bold text-brand-black transition hover:brightness-95">
                <CalendarDays className="h-4 w-4" /> Race calendar
              </Link>
              <Link to="/my-races" className="inline-flex min-h-touch items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 text-[15px] font-bold text-white backdrop-blur transition hover:bg-white/15">
                <Flag className="h-4 w-4" /> My races
              </Link>
            </div>
          </div>
          {s.spotlight && <Spotlight race={s.spotlight} mine={s.spotlightIsMine} />}
        </div>
      </section>

      {/* At a glance */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4" aria-label="At a glance">
        <Stat icon={<CalendarDays className="h-4 w-4" />} label="Upcoming" value={s.upcoming.length} to="/calendar" />
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Signed up" value={s.myUpcoming} to="/my-races" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Closing soon" value={s.deadlines.length} to="/my-races" alert={s.deadlines.length > 0} />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Confirmed" value={s.confirmed} to="/calendar" />
      </section>

      {/* Deadlines */}
      {s.deadlines.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-red-50 dark:border-red-900/70 dark:bg-red-950/30">
          <h2 className="flex items-center gap-2 px-4 pt-4 text-[15px] font-extrabold text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" /> Registration closing soon
          </h2>
          <ul className="mt-1 divide-y divide-red-200/70 dark:divide-red-900/60">
            {s.deadlines.map((r) => (
              <li key={r.id}>
                <Link to={`/races/${r.id}`} className="flex min-h-touch items-center justify-between gap-3 px-4 py-3 transition hover:bg-red-100/60 dark:hover:bg-red-900/20">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{r.event_name}</span>
                    <span className="text-xs text-red-700 dark:text-red-300">
                      Race {formatShort(r.race_date)} · {deadlineLabel(r.race_date)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                    Sign up <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        <section className="min-w-0 space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-extrabold tracking-tight">Next races</h2>
            <Link to="/calendar" className="flex min-h-touch items-center gap-1 text-sm font-bold text-neutral-600 hover:text-brand-black dark:text-neutral-300 dark:hover:text-white">
              Full calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <Spinner />
          ) : s.upcoming.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No upcoming races yet">
              New races will appear here as soon as they're added.
            </EmptyState>
          ) : (
            <div className="space-y-2.5">
              {s.upcoming.slice(0, 5).map((r) => (
                <RaceRow key={r.id} race={r} isMine={s.mine.has(r.id)} registeredCount={s.countByRace[r.id]} />
              ))}
            </div>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-3xl bg-brand-yellow text-brand-black">
            <div className="space-y-3 p-5">
              <Logo black className="h-12" />
              <p className="text-[15px] font-medium leading-relaxed">
                Road, mountain bike and triathlon athletes from the Wolfi's community. Train together, race together and wear the black and yellow at events across the UAE and beyond.
              </p>
            </div>
          </div>
          <div className="hidden overflow-hidden rounded-3xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
            <img src={`${BASE}brand/kit-2026.png`} alt="2026 team kit" loading="lazy" decoding="async" onError={hideParentOnError} className="w-full bg-neutral-100 object-contain dark:bg-neutral-800" />
            <p className="p-4 text-sm font-bold">The 2026 team kit</p>
          </div>
        </aside>
      </div>

      <SponsorStrip />
    </div>
  );
}

function Spotlight({ race, mine }: { race: Race; mine: boolean }) {
  const today = teamToday();
  const days = daysBetween(today, race.race_date);
  const open = !race.team_entry_only && isRegistrationOpen(race.race_date, today);
  return (
    <Link
      to={`/races/${race.id}`}
      className="relative block min-w-0 rounded-2xl bg-white p-4 text-brand-black shadow-[0_20px_40px_-20px_rgb(0_0_0/0.6)] ring-1 ring-black/5 transition hover:-translate-y-0.5 dark:bg-neutral-900 dark:text-white dark:ring-white/10 sm:p-5"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">{mine ? 'Your next race' : 'Next team race'}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight sm:text-xl">{race.event_name}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3 w-3" /> {race.location ?? 'TBC'} · {formatRaceDates(race)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[44px] font-extrabold leading-none tabular-nums tracking-tight">{days}</p>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">{days === 1 ? 'day' : 'days'} to go</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-neutral-100 pt-3 dark:border-neutral-800">
        <DisciplineBadge discipline={race.discipline} />
        {mine ? (
          <span className="rounded-full bg-brand-black px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-yellow dark:bg-brand-yellow dark:text-brand-black">You're in</span>
        ) : race.team_entry_only ? (
          <span className="text-xs font-semibold text-neutral-500">Team entry: the manager signs athletes up</span>
        ) : (
          <span className={cx('text-xs font-semibold', open ? 'text-red-600 dark:text-red-400' : 'text-neutral-500')}>{deadlineLabel(race.race_date, today)}</span>
        )}
        <ArrowRight className="ml-auto h-4 w-4 text-neutral-400" />
      </div>
    </Link>
  );
}

function Stat({ icon, label, value, to, alert }: { icon: React.ReactNode; label: string; value: number; to: string; alert?: boolean }) {
  return (
    <Link
      to={to}
      className={cx(
        'flex items-center gap-3 rounded-2xl border p-3.5 transition hover:shadow-lift sm:p-4',
        alert ? 'border-red-200 bg-white dark:border-red-900/70 dark:bg-neutral-900' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
      )}
    >
      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', alert ? 'bg-red-600 text-white' : 'bg-brand-yellow text-brand-black')}>{icon}</span>
      <span className="min-w-0">
        <span className={cx('block text-2xl font-extrabold leading-none tabular-nums', alert && 'text-red-600 dark:text-red-400')}>{value}</span>
        <span className="mt-1 block truncate text-[11px] font-bold uppercase tracking-wide text-neutral-500">{label}</span>
      </span>
    </Link>
  );
}
