import { useState } from 'react';
import { cx } from './ui';

export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('') || '?';

const sizes = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-2xl' };

/** Profile photo (Google or uploaded), falling back to initials on the team yellow. */
export function Avatar({ name, src, size = 'sm', className, tone = 'yellow' }: { name: string; src?: string | null; size?: keyof typeof sizes; className?: string; tone?: 'yellow' | 'dark' | 'muted' }) {
  const [broken, setBroken] = useState(false);
  const cls = cx('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold', sizes[size], className);
  if (src && !broken)
    return <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setBroken(true)} className={cx(cls, 'bg-neutral-200 object-cover dark:bg-neutral-800')} />;
  return (
    <span
      aria-hidden
      className={cx(
        cls,
        tone === 'yellow' && 'bg-brand-yellow text-brand-black',
        tone === 'dark' && 'bg-brand-black text-brand-yellow dark:bg-brand-yellow dark:text-brand-black',
        tone === 'muted' && 'bg-neutral-100 text-brand-black dark:bg-neutral-800 dark:text-white',
      )}
    >
      {initials(name)}
    </span>
  );
}
