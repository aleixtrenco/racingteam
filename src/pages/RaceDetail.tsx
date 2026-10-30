import type React from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CalendarDays, Clock, Mail, MapPin, Pencil, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileMap, useRaces, useRegister, useRegistrations, useUnregister } from '@/hooks/useData';
import { formatRaceDates, daysBetween, daysToDeadline, deadlineLabel, formatDate, isRegistrationOpen, registrationDeadline, teamToday } from '@/lib/dates';
import { TEAM_MANAGER } from '@/lib/supabase';
import { RaceFormModal } from '@/components/RaceFormModal';
import { Avatar } from '@/components/Avatar';
import { BibDate } from '@/components/BibDate';
import { Badge, Button, Card, DisciplineBadge, ErrorNote, Input, Label, PriorityBadge, Spinner, StatusBadge, cx } from '@/components/ui';

export default function RaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const { data: races = [], isLoading } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const register = useRegister();
  const unregister = useUnregister();
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const people = useProfileMap();

  const race = races.find((r) => r.id === id);
  const athletes = useMemo(() => regs.filter((r) => r.race_id === id).sort((a, b) => a.athlete_name.localeCompare(b.athlete_name)), [regs, id]);
  const mine = athletes.find((r) => r.user_id === profile?.id);

  if (isLoading) return <Spinner />;
  if (!race)
    return (
      <div className="py-16 text-center">
        <p className="font-bold">Race not found.</p>
        <Link to="/calendar" className="mt-3 inline-block font-bold underline">
          Back to calendar
        </Link>
      </div>
    );

  const today = teamToday();
  const cancelled = race.status === 'Cancelled';
  const open = isRegistrationOpen(race.race_date, today);
  const dl = daysToDeadline(race.race_date, today);
  const daysToRace = daysBetween(today, race.race_date);
  const canJoin = !cancelled && !race.team_entry_only && open && !mine;

  const join = () => profile && register.mutate({ raceId: race.id, userId: profile.id, note }, { onSuccess: () => setNote('') });

  const managerMail = `mailto:${TEAM_MANAGER.email}?subject=${encodeURIComponent(`Team entry: ${race.event_name} (${formatRaceDates(race)})`)}&body=${encodeURIComponent(
    `Hi ${TEAM_MANAGER.name},\n\nPlease handle the team entry for ${race.event_name} on ${formatRaceDates(race)}${race.location ? ` in ${race.location}` : ''}.\n\nAthletes registered in the app (${athletes.length}):\n${athletes.map((a) => `- ${a.athlete_name}${a.note ? ` (${a.note})` : ''}`).join('\n') || '- none yet'}\n\nThanks!`,
  )}`;

  return (
    <div className={cx('mx-auto max-w-3xl space-y-5', canJoin && 'pb-20 sm:pb-0')}>
      <button onClick={() => navigate(-1)} className="-ml-2 flex min-h-touch items-center gap-1 px-2 text-sm font-bold text-neutral-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <Card className="overflow-hidden">
        <div className={cx('h-1.5', cancelled ? 'bg-red-500' : 'bg-brand-yellow')} />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-1">
            <StatusBadge status={race.status} />
            <DisciplineBadge discipline={race.discipline} />
            <PriorityBadge priority={race.priority} />
            {race.team_entry_only && <Badge className="bg-neutral-900 text-white dark:bg-white dark:text-black">Team entry only</Badge>}
          </div>
          <div className="flex items-start gap-4">
            <BibDate date={race.race_date} size="lg" active={!!mine} muted={cancelled} />
            <h1 className={cx('min-w-0 flex-1 text-balance text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl', cancelled && 'line-through opacity-60')}>{race.event_name}</h1>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setEditing(true)} aria-label="Edit race" className="shrink-0 px-3">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Info icon={<CalendarDays className="h-4 w-4" />} label="Date" value={`${formatRaceDates(race)}${daysToRace > 0 ? ` · in ${daysToRace} day${daysToRace === 1 ? '' : 's'}` : daysToRace === 0 ? ' · today' : ''}`} />
            {race.location && <Info icon={<MapPin className="h-4 w-4" />} label="Location" value={race.location} />}
            {!race.team_entry_only && !cancelled && (
              <Info icon={<Clock className="h-4 w-4" />} label="Registration deadline" value={`${formatDate(registrationDeadline(race.race_date))} · ${deadlineLabel(race.race_date, today)}`} alert={open && dl <= 3} />
            )}
          </dl>
          {race.athletes_racing_note && (
            <div className="rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">Athletes racing</p>
              <p className="whitespace-pre-line">{race.athletes_racing_note}</p>
            </div>
          )}
        </div>
      </Card>

      {cancelled && (
        <Notice tone="red" icon={<AlertTriangle className="h-5 w-5" />} title="This race has been cancelled">
          Registrations are closed. Check the calendar for other events.
        </Notice>
      )}

      {race.team_entry_only && !cancelled && (
        <Notice tone="dark" icon={<ShieldAlert className="h-5 w-5" />} title="Team entry only">
          You can't sign up individually for this race. {TEAM_MANAGER.name} handles the team entry. Get in touch if you'd like to be included.
          {isAdmin && (
            <a href={managerMail} className="mt-3 inline-flex min-h-touch items-center gap-2 rounded-xl bg-brand-yellow px-4 font-bold text-brand-black">
              <Mail className="h-4 w-4" /> Message {TEAM_MANAGER.name}
            </a>
          )}
        </Notice>
      )}

      {/* Registration */}
      {!cancelled && !race.team_entry_only && (
        <Card className="space-y-3 p-5">
          {mine ? (
            <>
              <p className="font-extrabold">You're registered for this race ✓</p>
              {mine.note && <p className="text-sm text-neutral-500">Your note: {mine.note}</p>}
              {open ? (
                <>
                  <p className="text-sm text-neutral-500">You can cancel until {formatDate(registrationDeadline(race.race_date))}.</p>
                  <Button variant="secondary" className="w-full sm:w-auto" loading={unregister.isPending} onClick={() => unregister.mutate(mine.id)}>
                    Unregister
                  </Button>
                </>
              ) : (
                <p className="text-sm text-neutral-500">Registration is closed, so changes go through the team manager.</p>
              )}
              <ErrorNote error={unregister.error} />
            </>
          ) : canJoin ? (
            <>
              <Label label="Note (optional)" hint="Distance, wave, t-shirt size…">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 90 km, size M" maxLength={200} />
              </Label>
              <Button className="hidden w-full sm:flex" loading={register.isPending} onClick={join}>
                Add Me to This Race
              </Button>
              <ErrorNote error={register.error} />
            </>
          ) : (
            <p className="text-sm font-bold text-neutral-500">Registration for this race has closed.</p>
          )}
        </Card>
      )}

      {/* Athletes */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold">
          <Users className="h-5 w-5" /> Registered athletes <span className="text-neutral-400">({athletes.length})</span>
        </h2>
        {athletes.length === 0 ? (
          <p className="text-sm text-neutral-500">No one has signed up yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {athletes.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Link to={a.user_id ? `/athletes/${a.user_id}` : '#'} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={a.athlete_name} src={a.user_id ? people.get(a.user_id)?.avatar_url : null} tone="muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">
                      {a.athlete_name}
                      {a.user_id === profile?.id && <Badge className="ml-2 bg-brand-yellow align-middle text-brand-black">You</Badge>}
                    </span>
                    {a.note && <span className="block truncate text-xs text-neutral-500">{a.note}</span>}
                  </span>
                </Link>
                {isAdmin && a.user_id !== profile?.id && (
                  <Button variant="ghost" className="text-xs text-red-600" onClick={() => unregister.mutate(a.id)} aria-label={`Remove ${a.athlete_name}`}>
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Phones: the main action stays in reach above the tab bar */}
      {canJoin && (
        <div className="fixed inset-x-0 bottom-[calc(58px+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95 sm:hidden">
          <span className="min-w-0 flex-1 text-xs font-semibold text-red-600 dark:text-red-400">{deadlineLabel(race.race_date, today)}</span>
          <Button className="rounded-full px-5" loading={register.isPending} onClick={join}>
            Add Me to This Race
          </Button>
        </div>
      )}

      {isAdmin && <RaceFormModal open={editing} onClose={() => setEditing(false)} race={race} />}
    </div>
  );
}

const Info = ({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) => (
  <div className="flex gap-2">
    <span className="mt-0.5 text-neutral-400">{icon}</span>
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className={cx('font-bold', alert && 'text-red-600 dark:text-red-400')}>{value}</dd>
    </div>
  </div>
);

const Notice = ({ tone, icon, title, children }: { tone: 'red' | 'dark'; icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className={cx('rounded-2xl p-5', tone === 'red' ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200' : 'bg-brand-black text-white dark:border dark:border-neutral-700')}>
    <p className="flex items-center gap-2 font-extrabold">
      {icon} {title}
    </p>
    <div className="mt-1 text-sm opacity-90">{children}</div>
  </div>
);
