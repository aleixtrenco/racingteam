// Date rules. Race dates are calendar dates (yyyy-mm-dd) in the team's time zone.
export const TEAM_TZ = 'Asia/Dubai';
export const REGISTRATION_CLOSES_DAYS_BEFORE = 3;
export const DEADLINE_WARNING_DAYS = 7;

const DAY = 86_400_000;
const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const addDays = (iso: string, n: number) => new Date(toUtc(iso) + n * DAY).toISOString().slice(0, 10);

/** Today's date in the team time zone, as yyyy-mm-dd. */
export function teamToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TEAM_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

/** Whole days from `from` to `to` (both yyyy-mm-dd). */
export const daysBetween = (from: string, to: string) => Math.round((toUtc(to) - toUtc(from)) / DAY);

/** Last day on which athletes can register or unregister (inclusive). Mirrors registration_open() in SQL. */
export const registrationDeadline = (raceDate: string) => addDays(raceDate, -REGISTRATION_CLOSES_DAYS_BEFORE);

export const isRegistrationOpen = (raceDate: string, today = teamToday()) => today <= registrationDeadline(raceDate);

/** Days left to register: 0 = closes today, negative = closed. */
export const daysToDeadline = (raceDate: string, today = teamToday()) => daysBetween(today, registrationDeadline(raceDate));

export const isUpcoming = (raceDate: string, today = teamToday()) => raceDate >= today;

/** A race stays upcoming until its last day (multi-day events). */
export const raceIsUpcoming = (race: { race_date: string; end_date?: string | null }, today = teamToday()) => isUpcoming(race.end_date ?? race.race_date, today);

export function deadlineLabel(raceDate: string, today = teamToday()): string {
  const d = daysToDeadline(raceDate, today);
  if (d < 0) return 'Registration closed';
  if (d === 0) return 'Closes today';
  if (d === 1) return 'Closes tomorrow';
  return `Closes in ${d} days`;
}

const fmt = (opts: Intl.DateTimeFormatOptions) => (iso: string) =>
  new Date(toUtc(iso)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

export const formatDate = fmt({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const formatShort = fmt({ day: 'numeric', month: 'short' });
export const formatMonth = fmt({ month: 'long', year: 'numeric' });
export const dayOfMonth = fmt({ day: 'numeric' });
export const monthAbbr = fmt({ month: 'short' });

/** "Thu, 12 Nov 2026" or, for multi-day events, "12–15 Nov 2026" / "30 Jan – 2 Feb 2027". */
export function formatRaceDates(race: { race_date: string; end_date?: string | null }): string {
  const { race_date: a, end_date: b } = race;
  if (!b || b === a) return formatDate(a);
  const year = fmt({ year: 'numeric' });
  if (a.slice(0, 7) === b.slice(0, 7)) return `${dayOfMonth(a)}–${dayOfMonth(b)} ${monthAbbr(a)} ${year(a)}`;
  return `${formatShort(a)} – ${formatShort(b)} ${year(b)}`;
}
