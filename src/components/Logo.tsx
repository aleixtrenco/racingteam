import { cx } from './ui';

const BASE = import.meta.env.BASE_URL;

/**
 * Team logo (black artwork). `white` renders it white for dark surfaces;
 * `black` keeps it black in both themes (e.g. on yellow). Otherwise it turns white in dark mode.
 * `emblem` shows only the chain-link mark, for tight spaces.
 */
export const Logo = ({ className, white, black, emblem }: { className?: string; white?: boolean; black?: boolean; emblem?: boolean }) => (
  <img
    src={emblem ? `${BASE}brand/emblem.png` : `${BASE}brand/logo.webp`}
    alt="Wolfi's Racing Team"
    width={emblem ? 128 : 700}
    height={emblem ? 147 : 282}
    decoding="async"
    draggable={false}
    className={cx('h-9 w-auto select-none', white ? 'brightness-0 invert' : !black && 'dark:brightness-0 dark:invert', className)}
  />
);
