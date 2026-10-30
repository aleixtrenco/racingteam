import { useSponsors } from '@/hooks/useData';
import { cx } from './ui';

export function SponsorStrip() {
  const { data: sponsors = [] } = useSponsors();
  if (!sponsors.length) return null;
  const tier = (t: 1 | 2) => sponsors.filter((s) => s.tier === t);
  const item = (s: (typeof sponsors)[number], big: boolean) => {
    const content = s.logo_url ? (
      <img src={s.logo_url} alt={s.name} loading="lazy" decoding="async" className={cx('w-auto object-contain dark:invert', big ? 'h-10' : 'h-7')} />
    ) : (
      <span className={cx('font-extrabold uppercase tracking-widest', big ? 'text-xl' : 'text-sm text-neutral-500')}>{s.name}</span>
    );
    return s.website ? (
      <a key={s.id} href={s.website} target="_blank" rel="noreferrer" className="flex min-h-touch items-center opacity-80 transition hover:opacity-100">
        {content}
      </a>
    ) : (
      <span key={s.id} className="flex min-h-touch items-center opacity-80">{content}</span>
    );
  };
  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 px-4 py-6 text-center dark:border-neutral-800">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Our partners</p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2">{tier(1).map((s) => item(s, true))}</div>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">{tier(2).map((s) => item(s, false))}</div>
    </section>
  );
}
