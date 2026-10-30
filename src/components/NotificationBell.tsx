import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarClock, Camera, Flag } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cx } from './ui';

const SEEN_KEY = 'wrt-seen-notifications';
const readSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
  } catch {
    return [];
  }
};

export function NotificationBell() {
  const items = useNotifications();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>(readSeen);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !seen.includes(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const ids = items.map((n) => n.id);
    setSeen(ids);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
    } catch {
      /* storage unavailable */
    }
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, items]);

  const icon = { deadline: CalendarClock, recap: Camera, info: Flag };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <p className="border-b border-neutral-200 px-4 py-3 text-sm font-extrabold dark:border-neutral-800">Notifications</p>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">You're all caught up.</p>
          ) : (
            items.map((n) => {
              const Icon = icon[n.tone];
              return (
                <Link key={n.id} to={n.href} onClick={() => setOpen(false)} className="flex gap-3 border-b border-neutral-100 px-4 py-3 last:border-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">
                  <span className={cx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', n.tone === 'deadline' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-brand-yellow text-brand-black')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{n.title}</span>
                    <span className="block text-xs text-neutral-500">{n.body}</span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
