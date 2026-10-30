import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CalendarClock, CalendarDays, CheckCircle2, Flag, ListChecks } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useRegistrations } from '@/hooks/useData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { DEADLINE_WARNING_DAYS, daysToDeadline, deadlineLabel, formatShort, isUpcoming, teamToday } from '@/lib/dates';
import { Logo } from '@/components/Logo';
import { RaceRow } from '@/components/RaceRow';
import { SponsorStrip } from '@/components/SponsorStrip';
import { Card, EmptyState, PullIndicator, Spinner } from '@/components/ui';

const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.style.display = 'none');

export default function Home() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const ptr = usePullToRefresh(() => qc.invalidateQueries());

  const stats = useMemo(() => {
    const today = teamToday();
    const upcoming = races.filter((r) => isUpcoming(r.race_date, today) && r.status !== 'Cancelled');
    const mine = new Set(regs.filter((r) => r.user_id === profile?.id).map((r) => r.race_id));
    const countByRace = regs.reduce<Record<string, number>>((m, r) => ((m[r.race_id] = (m[r.race_id] ?? 0) + 1), m), {});
    const deadlines = upcoming.filter((r) => {
      const d = daysToDeadline(r.race_date, today);
      return !r.team_entry_only && !mine.has(r.id) && d >= 0 && d <= DEADLINE_WARNING_DAYS;
    });
    return {
      upcoming,
      mine,
      countByRace,
      deadlines,
      myUpcoming: upcoming.filter((r) => mine.has(r.id)).length,
      confirmed: upcoming.filter((r) => r.status === 'Confirmed').length,
    };
  }, [races, regs, profile]);

  const firstName = profile?.full_name.split(' ')[0];

  return (
    <div className="space-y-6">
      <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />

      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden bg-brand-black px-6 py-10 text-white sm:mx-0 sm:rounded-3xl sm:px-10 sm:py-14">
        <img
          src="/brand/hero.jpg"
          alt=""
          fetchPriority="high"
          decoding="async"
          sizes="100vw"
          onError={hideOnError}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="relative max-w-xl">
          <Logo inverted className="h-12 sm:h-14" />
          <h1 className="mt-6 text-3xl font-extrabold leading-tight sm:text-4xl">
            {firstName ? `Ready to race, ${firstName}?` : 'Ready to race?'}
          </h1>
          <p className="mt-2 text-neutral-300">Find your next race, sign up in one tap and share your results with the team.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/calendar" className="inline-flex min-h-touch items-center gap-2 rounded-xl bg-brand-yellow px-5 font-bold text-brand-black">
              <CalendarDays className="h-4 w-4" /> Race calendar
            </Link>
            <Link to="/my-races" className="inline-flex min-h-touch items-center gap-2 rounded-xl border border-white/30 px-5 font-bold text-white hover:bg-white/10">
              <Flag className="h-4 w-4" /> My races
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CalendarDays className="h-5 w-5" />} label="Upcoming races" value={stats.upcoming.length} to="/calendar" />
        <Stat icon={<ListChecks className="h-5 w-5" />} label="My registrations" value={stats.myUpcoming} to="/my-races" />
        <Stat icon={<CalendarClock className="h-5 w-5" />} label="Deadlines soon" value={stats.deadlines.length} to="/my-races" alert={stats.deadlines.length > 0} />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Confirmed" value={stats.confirmed} to="/calendar" />
      </section>

      {/* Deadlines alert */}
      {stats.deadlines.length > 0 && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <h2 className="flex items-center gap-2 font-extrabold text-red-700 dark:text-red-300">
            <AlertTriangle className="h-5 w-5" /> Registration deadlines approaching
          </h2>
          <ul className="mt-2 divide-y divide-red-200 dark:divide-red-900">
            {stats.deadlines.map((r) => (
              <li key={r.id}>
                <Link to={`/races/${r.id}`} className="flex min-h-touch items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{r.event_name}</span>
                    <span className="text-xs text-red-700 dark:text-red-300">
                      Race {formatShort(r.race_date)} · {deadlineLabel(r.race_date)}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-red-700 dark:text-red-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next races */}
        <section className="min-w-0 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Next races</h2>
            <Link to="/calendar" className="flex min-h-touch items-center gap-1 text-sm font-bold">
              Full calendar <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {isLoading ? (
            <Spinner />
          ) : stats.upcoming.length === 0 ? (
            <EmptyState icon={<CalendarDays className="h-8 w-8" />} title="No upcoming races yet">
              New races will appear here as soon as they're added.
            </EmptyState>
          ) : (
            stats.upcoming.slice(0, 5).map((r) => <RaceRow key={r.id} race={r} isMine={stats.mine.has(r.id)} registeredCount={stats.countByRace[r.id]} />)
          )}
        </section>

        {/* Team card + kit */}
        <aside className="min-w-0 space-y-4">
          <Card className="overflow-hidden">
            <div className="h-1.5 bg-brand-yellow" />
            <div className="space-y-3 p-5">
              <Logo className="h-10" />
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Wolfi's Racing Team brings together road, mountain bike and triathlon athletes from the Wolfi's community. Train together, race together, and represent the black and yellow at events across the UAE and beyond.
              </p>
            </div>
          </Card>
          <Card className="hidden overflow-hidden lg:block">
            <img src="/brand/kit-2026.png" alt="2026 team kit" loading="lazy" decoding="async" onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = 'none')} className="w-full bg-neutral-100 object-contain dark:bg-neutral-800" />
            <p className="p-4 text-sm font-bold">The 2026 team kit</p>
          </Card>
        </aside>
      </div>

      <SponsorStrip />
    </div>
  );
}

function Stat({ icon, label, value, to, alert }: { icon: React.ReactNode; label: string; value: number; to: string; alert?: boolean }) {
  return (
    <Link to={to} className="rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
      <span className={alert ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}>{icon}</span>
      <p className={`mt-2 text-3xl font-extrabold ${alert ? 'text-red-600 dark:text-red-400' : ''}`}>{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</p>
    </Link>
  );
}
