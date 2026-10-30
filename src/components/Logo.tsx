import { cx } from './ui';

/** Team logo. `inverted` renders the white version for dark backgrounds; dark mode inverts automatically. */
export const Logo = ({ className, inverted }: { className?: string; inverted?: boolean }) => (
  <img
    src="/brand/logo.svg"
    alt="Wolfi's Racing Team"
    width={180}
    height={48}
    decoding="async"
    className={cx('h-9 w-auto select-none', inverted ? 'invert' : 'dark:invert', className)}
  />
);
