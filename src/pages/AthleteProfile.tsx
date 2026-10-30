import type React from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, ExternalLink, Medal, Pencil, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfiles, useRaces, useRegistrations, useResults } from '@/hooks/useData';
import { formatDate, isUpcoming, teamToday } from '@/lib/dates';
import { seasonRanking } from '@/lib/ranking';
import { Avatar } from '@/components/Avatar';
import { BibDate } from '@/components/BibDate';
import { ProfileForm } from '@/components/ProfileForm';
import { RaceRow } from '@/components/RaceRow';
import { Badge, EmptyState, Modal, Spinner, cx } from '@/components/ui';

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

export default function AthleteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: me, isAdmin } = useAuth();
  const { data: profiles = [], isLoading } = useProfiles();
  const { data: races = [] } = useRaces();
  const { data: regs = [] } = useRegistrations();
  const { data: results = [] } = useResults();
  const [editing, setEditing] = useState(false);

  const athlete = id === me?.id ? (profiles.find((p) => p.id === id) ?? me) : profiles.find((p) => p.id === id);
  const year = Number(teamToday().slice(0, 4));

  const data = useMemo(() => {
    if (!athlete) return null;
    const mine = results.filter((r) => r.user_id === athlete.id);
    const standings = seasonRanking(results, year);
    const rankIdx = standings.findIndex((r) => r.userId === athlete.id);
    const season = standings[rankIdx];
    const upcomingIds = new Set(regs.filter((g) => g.user_id === athlete.id).map((g) => g.race_id));
    return {
      results: mine,
      season,
      rank: rankIdx >= 0 && season?.points ? rankIdx + 1 : null,
      podiums: mine.filter((r) => r.overall_position && r.overall_position <= 3).length,
      upcoming: races.filter((r) => upcomingIds.has(r.id) && isUpcoming(r.race_date) && r.status !== 'Cancelled'),
    };
  }, [athlete, results, regs, races, year]);

  if (isLoading && !athlete) return <Spinner />;
  if (!athlete || !data)
    return (
      <EmptyState title="Athlete not found">
        <Link to="/ranking" className="font-bold underline">
          Back to the ranking
        </Link>
      </EmptyState>
    );

  const isMe = athlete.id === me?.id;
  const insta = athlete.instagram ? `https://instagram.com/${athlete.instagram}` : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button onClick={() => navigate(-1)} className="-ml-2 flex min-h-touch items-center gap-1 px-2 text-sm font-bold text-neutral-500">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <section className="relative overflow-hidden rounded-[28px] bg-brand-black p-5 text-white sm:p-7">
        <div aria-hidden className="absolute -right-10 top-0 h-full w-[70px] skew-x-[-12deg] bg-brand-yellow sm:w-[22%]" />
        <div aria-hidden className="absolute -right-10 top-0 h-full w-[70px] -translate-x-[24px] skew-x-[-12deg] border-l-[6px] border-white/90 sm:w-[22%]" />
        <div className="relative flex flex-col gap-4 pr-14 sm:flex-row sm:items-center sm:pr-32">
          <Avatar name={athlete.full_name} src={athlete.avatar_url} size="xl" className="ring-4 ring-white/10" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-yellow">{athlete.role === 'admin' ? 'Team admin · Athlete' : "Wolfi's Racing Team athlete"}</p>
            <h1 className="mt-1 text-balance text-3xl font-extrabold leading-tight">{athlete.full_name}</h1>
            {athlete.disciplines?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {athlete.disciplines.map((d) => (
                  <Badge key={d} className="bg-white/10 text-white">{d === 'Mountainbike' ? 'MTB' : d}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        {athlete.bio && <p className="relative mt-4 max-w-xl pr-14 text-[15px] leading-relaxed text-neutral-300 sm:pr-0">{athlete.bio}</p>}
        <div className="relative mt-4 flex flex-wrap gap-2">
          {athlete.strava_url && <ExtLink href={athlete.strava_url}>Strava</ExtLink>}
          {insta && <ExtLink href={insta}>@{athlete.instagram}</ExtLink>}
          {(isMe || isAdmin) && athlete.tshirt_size && <span className="inline-flex min-h-[36px] items-center rounded-full bg-white/10 px-3 text-xs font-bold">Kit size {athlete.tshirt_size}</span>}
          {isMe && (
            <button onClick={() => setEditing(true)} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-brand-yellow px-4 text-xs font-bold text-brand-black">
              <Pencil className="h-3.5 w-3.5" /> Edit profile
            </button>
          )}
        </div>
      </section>

      {/* Season */}
      <section aria-label={`${year} season`} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat label={`${year} points`} value={data.season?.points ?? 0} highlight />
        <Stat label="Team rank" value={data.rank ? `#${data.rank}` : '–'} />
        <Stat label={`${year} races`} value={data.season?.races ?? 0} />
        <Stat label="Podiums (all time)" value={data.podiums} />
      </section>

      {/* Upcoming */}
      <section className="space-y-2.5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <CalendarDays className="h-5 w-5" /> Racing next
        </h2>
        {data.upcoming.length === 0 ? (
          <p className="text-sm text-neutral-500">{isMe ? "You're not signed up for any upcoming races." : 'No upcoming races yet.'}</p>
        ) : (
          data.upcoming.map((r) => <RaceRow key={r.id} race={r} isMine={isMe} />)
        )}
      </section>

      {/* Results history */}
      <section className="space-y-2.5">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Trophy className="h-5 w-5" /> Results
        </h2>
        {data.results.length === 0 ? (
          <p className="text-sm text-neutral-500">No results posted yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {data.results.map((r) => {
              const podium = !!r.overall_position && r.overall_position <= 3;
              return (
                <li key={r.id}>
                  <Link to={r.race_id ? `/races/${r.race_id}` : '/results'} className="flex items-center gap-3 px-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                    {r.race_date && <BibDate date={r.race_date} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{r.race_name}</p>
                      <p className="truncate text-xs text-neutral-500">{[r.race_date && formatDate(r.race_date), r.result_text].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className={cx('flex h-10 min-w-12 shrink-0 items-center justify-center gap-1 rounded-xl px-2 text-sm font-extrabold tabular-nums', podium ? 'bg-brand-yellow text-brand-black' : 'bg-neutral-100 dark:bg-neutral-800')}>
                      {podium && <Medal className="h-4 w-4" />}
                      {r.overall_position ? ordinal(r.overall_position) : '–'}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {isMe && me && (
        <Modal open={editing} onClose={() => setEditing(false)} title="Edit racing profile">
          <ProfileForm profile={athlete} submitLabel="Save profile" onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        </Modal>
      )}
    </div>
  );
}

const Stat = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={cx('rounded-2xl border p-4', highlight ? 'border-brand-black bg-brand-yellow text-brand-black dark:border-brand-yellow' : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900')}>
    <p className="text-3xl font-extrabold leading-none tabular-nums">{value}</p>
    <p className={cx('mt-1.5 text-[11px] font-bold uppercase tracking-wide', highlight ? 'text-brand-black/70' : 'text-neutral-500')}>{label}</p>
  </div>
);

const ExtLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/20 px-3 text-xs font-bold hover:bg-white/10">
    {children} <ExternalLink className="h-3 w-3" />
  </a>
);
