import { ExternalLink } from 'lucide-react';
import { logoSrc, useSponsors } from '@/hooks/useData';
import type { Sponsor } from '@/lib/types';
import { cx } from './ui';

/** Sponsor wall: tier 1 large, tier 2 smaller. Every logo opens the sponsor's website. */
export function SponsorStrip() {
  const { data: sponsors = [] } = useSponsors();
  if (!sponsors.length) return null;
  const tier1 = sponsors.filter((s) => s.tier === 1);
  const tier2 = sponsors.filter((s) => s.tier === 2);
  return (
    <section aria-labelledby="partners" className="rounded-3xl border border-neutral-200 bg-white px-4 py-6 dark:border-neutral-800 dark:bg-neutral-900 sm:px-8">
      <h2 id="partners" className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
        Proudly supported by
      </h2>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {tier1.map((s) => <SponsorTile key={s.id} sponsor={s} big />)}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tier2.map((s) => <SponsorTile key={s.id} sponsor={s} />)}
      </div>
    </section>
  );
}

function SponsorTile({ sponsor, big }: { sponsor: Sponsor; big?: boolean }) {
  const src = logoSrc(sponsor.logo_url);
  const body = src ? (
    <img
      src={src}
      alt={sponsor.name}
      loading="lazy"
      decoding="async"
      className={cx('w-auto max-w-[80%] object-contain transition dark:brightness-0 dark:invert', big ? 'max-h-10 sm:max-h-12' : 'max-h-7 sm:max-h-8')}
    />
  ) : (
    <span className={cx('font-extrabold uppercase tracking-[0.18em]', big ? 'text-xl' : 'text-base')}>{sponsor.name}</span>
  );
  const cls = cx(
    'group relative flex items-center justify-center rounded-2xl border border-neutral-100 bg-neutral-50 px-3 transition dark:border-neutral-800 dark:bg-neutral-950',
    big ? 'h-24 sm:h-28' : 'h-16 sm:h-20',
  );
  if (!sponsor.website) return <div className={cls}>{body}</div>;
  return (
    <a
      href={sponsor.website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${sponsor.name} (opens website)`}
      className={cx(cls, 'hover:-translate-y-0.5 hover:border-neutral-300 hover:bg-white hover:shadow-lift dark:hover:border-neutral-600')}
    >
      {body}
      <ExternalLink className="absolute right-2 top-2 h-3.5 w-3.5 text-neutral-400 opacity-0 transition group-hover:opacity-100" />
    </a>
  );
}
