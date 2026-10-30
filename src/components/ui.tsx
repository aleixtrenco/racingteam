import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Discipline, Priority, RaceStatus } from '@/lib/types';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'yellow';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-black text-white hover:bg-neutral-800 dark:bg-white dark:text-brand-black dark:hover:bg-neutral-200',
  secondary: 'border border-neutral-300 bg-white text-brand-black hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:hover:bg-neutral-800',
  ghost: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  yellow: 'bg-brand-yellow text-brand-black hover:brightness-95',
};

export function Button({ variant = 'primary', loading, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx('inline-flex min-h-touch items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:opacity-50', variants[variant], className)}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cx('rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900', className)}>{children}</div>
);

export const Spinner = ({ className }: { className?: string }) => (
  <div className={cx('flex justify-center py-12', className)}>
    <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
  </div>
);

export const EmptyState = ({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 px-6 py-10 text-center dark:border-neutral-700">
    {icon && <div className="text-neutral-400">{icon}</div>}
    <p className="font-bold">{title}</p>
    {children && <div className="text-sm text-neutral-500">{children}</div>}
  </div>
);

export const ErrorNote = ({ error }: { error: unknown }) =>
  error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error instanceof Error ? error.message : String(error)}</p> : null;

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ---- badges ----------------------------------------------------------------

const pill = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide';

export const StatusBadge = ({ status }: { status: RaceStatus }) => (
  <span
    className={cx(
      pill,
      status === 'Confirmed' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      status === 'Tentative' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
      status === 'Cancelled' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    )}
  >
    {status}
  </span>
);

export const DisciplineBadge = ({ discipline }: { discipline: Discipline }) => (
  <span className={cx(pill, 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300')}>{discipline === 'Mountainbike' ? 'MTB' : discipline}</span>
);

export const PriorityBadge = ({ priority }: { priority: Priority }) =>
  priority === 'High' ? <span className={cx(pill, 'bg-brand-yellow text-brand-black')}>High priority</span> : null;

export const Badge = ({ children, className }: { children: ReactNode; className?: string }) => <span className={cx(pill, className)}>{children}</span>;

// ---- form fields -----------------------------------------------------------

const fieldCls =
  'w-full min-h-touch rounded-xl border border-neutral-300 bg-white px-3 text-base text-brand-black outline-none focus:border-brand-black focus:ring-2 focus:ring-brand-yellow dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white';

export const Label = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-bold">{label}</span>
    {children}
    {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
  </label>
);

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(fieldCls, p.className)} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cx(fieldCls, 'py-2', p.className)} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx(fieldCls, p.className)} />;

// ---- modal (bottom sheet on phones, dialog on larger screens) ------------

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl dark:bg-neutral-900 sm:max-w-lg sm:rounded-3xl sm:pb-4">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} className="-mr-2 flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 pt-4">{children}</div>
      </div>
    </div>
  );
}

export function PullIndicator({ pull, refreshing }: { pull: number; refreshing: boolean }) {
  if (!pull && !refreshing) return null;
  return (
    <div className="pointer-events-none flex justify-center overflow-hidden transition-[height]" style={{ height: pull }}>
      <Loader2 className={cx('mt-4 h-6 w-6 text-neutral-400', refreshing && 'animate-spin')} style={{ transform: `rotate(${pull * 3}deg)` }} />
    </div>
  );
}
