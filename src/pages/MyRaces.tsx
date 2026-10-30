import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CheckCircle2, Flag } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useRaces, useRegister, useRegistrations, useResults, useUnregister } from '@/hooks/useData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { DEADLINE_WARNING_DAYS, daysToDeadline, deadlineLabel, formatShort, isRegistrationOpen, raceIsUpcoming, registrationDeadline, teamToday } from '@/lib/dates';
import { RaceRow } from '@/components/RaceRow';
import { Button, EmptyState, ErrorNote, PageHeader, PullIndicator, Spinner } from '@/components/ui';

export default function MyRaces() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const { data: results = [] } = useResults();
  const register = useRegister();
  const unregister = useUnregister();
  const ptr = usePullToRefresh(() => qc.invalidateQueries());

  const { closing, upcoming, past, myRegs, recapped } = useMemo(() => {
    const today = teamToday();
    const myRegs = new Map(regs.filter((r) => r.user_id === profile?.id).map((r) => [r.race_id, r]));
    const recapped = new Set(results.filter((r) => r.user_id === profile?.id).map((r) => r.race_id));
    const active = races.filter((r) => r.status !== 'Cancelled');
    return {
      myRegs,
      recapped,
      closing: active.filter((r) => {
        const d = daysToDeadline(r.race_date, today);
        return !myRegs.has(r.id) && !r.team_entry_only && d >= 0 && d <= DEADLINE_WARNING_DAYS;
      }),
      upcoming: races.filter((r) => myRegs.has(r.id) && raceIsUpcoming(r, today)),
      past: active.filter((r) => myRegs.has(r.id) && !raceIsUpcoming(r, today)).reverse(),
    };
  }, [races, regs, results, profile]);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-8">
      <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} />
      <PageHeader title="My races" subtitle="Your sign-ups, closing deadlines and race recaps." />
      <ErrorNote error={register.error || unregister.error} />

      {closing.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-extrabold text-red-600 dark:text-red-400">Deadlines closing within {DEADLINE_WARNING_DAYS} days</h2>
          {closing.map((r) => (
            <RaceRow
              key={r.id}
              race={r}
              action={
                <Button
                  className="px-3"
                  loading={register.isPending && register.variables?.raceId === r.id}
                  onClick={() => profile && register.mutate({ raceId: r.id, userId: profile.id })}
                >
                  Add me
                </Button>
              }
            />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-extrabold">Signed up ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={<Flag className="h-8 w-8" />} title="You're not signed up for any races yet">
            <Link to="/calendar" className="font-bold text-brand-black underline dark:text-white">
              Browse the calendar
            </Link>
          </EmptyState>
        ) : (
          upcoming.map((r) => {
            const reg = myRegs.get(r.id)!;
            const open = isRegistrationOpen(r.race_date);
            return (
              <div key={r.id} className="space-y-1">
                <RaceRow
                  race={r}
                  isMine
                  action={
                    open && r.status !== 'Cancelled' ? (
                      <Button variant="secondary" className="px-3" loading={unregister.isPending && unregister.variables === reg.id} onClick={() => unregister.mutate(reg.id)}>
                        Cancel
                      </Button>
                    ) : undefined
                  }
                />
                <p className="px-3 text-xs text-neutral-500">
                  {r.status === 'Cancelled'
                    ? 'This race was cancelled.'
                    : open
                      ? `You can cancel until ${formatShort(registrationDeadline(r.race_date))} (${deadlineLabel(r.race_date).toLowerCase()}).`
                      : 'Registration closed: contact the team manager for changes.'}
                  {reg.note && ` · Note: ${reg.note}`}
                </p>
              </div>
            );
          })
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-extrabold">My race recaps</h2>
        {past.length === 0 ? (
          <p className="text-sm text-neutral-500">Races you've done will show up here so you can add your result and photos.</p>
        ) : (
          past.map((r) => (
            <RaceRow
              key={r.id}
              race={r}
              isMine
              action={
                recapped.has(r.id) ? (
                  <span className="flex items-center gap-1 px-2 text-sm font-bold text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </span>
                ) : (
                  <Link to={`/results?add=${r.id}`} className="inline-flex min-h-touch items-center gap-1 rounded-xl bg-brand-yellow px-3 text-sm font-bold text-brand-black">
                    <Camera className="h-4 w-4" /> Add recap
                  </Link>
                )
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
