import { dayOfMonth, monthAbbr } from '@/lib/dates';
import { cx } from './ui';

/** Race date drawn as a race bib: month strip on top, big day number, safety-pin holes. */
export function BibDate({ date, active, muted, size = 'md' }: { date: string; active?: boolean; muted?: boolean; size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <div
      className={cx(
        'relative flex shrink-0 flex-col overflow-hidden rounded-lg border-2 text-center',
        lg ? 'h-[76px] w-[68px]' : 'h-[60px] w-[54px]',
        active ? 'border-brand-black bg-brand-yellow text-brand-black' : 'border-brand-black bg-white text-brand-black dark:border-neutral-600 dark:bg-neutral-950 dark:text-white',
        muted && 'opacity-50',
      )}
      aria-label={date}
    >
      <span className={cx('font-bold uppercase leading-none tracking-[0.14em]', lg ? 'py-1 text-[11px]' : 'py-[3px] text-[10px]', active ? 'bg-brand-black text-brand-yellow' : 'bg-brand-black text-white dark:bg-neutral-700')}>
        {monthAbbr(date)}
      </span>
      <span className={cx('flex flex-1 items-center justify-center font-extrabold tabular-nums leading-none', lg ? 'text-[30px]' : 'text-[24px]')}>{dayOfMonth(date)}</span>
      <span className="absolute bottom-1 left-1 h-1 w-1 rounded-full bg-current opacity-30" />
      <span className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-current opacity-30" />
    </div>
  );
}
