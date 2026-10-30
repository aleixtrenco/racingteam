import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Camera, Flag, Home, Settings, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { ProfileDrawer, initials } from './ProfileDrawer';
import { cx } from './ui';

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/my-races', label: 'My Races', icon: Flag },
  { to: '/results', label: 'Results', icon: Camera },
  { to: '/ranking', label: 'Ranking', icon: Trophy },
];

export function Layout() {
  const { profile, isAdmin } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const nav = isAdmin ? [...tabs, { to: '/admin', label: 'Admin', icon: Settings }] : tabs;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-neutral-800 dark:bg-brand-black/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <NavLink to="/" aria-label="Home">
            <Logo className="h-8" />
          </NavLink>
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={'end' in t}
                className={({ isActive }) =>
                  cx('rounded-lg px-3 py-2 text-sm font-bold', isActive ? 'bg-brand-yellow text-brand-black' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800')
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <NotificationBell />
            <button onClick={() => setDrawer(true)} className="flex min-h-touch min-w-touch items-center justify-center" aria-label="Open profile">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-black text-sm font-extrabold text-brand-yellow dark:bg-brand-yellow dark:text-brand-black">
                {initials(profile?.full_name ?? '')}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:pb-12">
        <Outlet />
      </main>

      {/* Fixed bottom tab bar on phones */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-brand-black/95 md:hidden">
        <div className="grid grid-cols-5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => cx('flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold', isActive ? 'text-brand-black dark:text-brand-yellow' : 'text-neutral-400')}
            >
              {({ isActive }) => (
                <>
                  <span className={cx('flex h-7 w-12 items-center justify-center rounded-full', isActive && 'bg-brand-yellow text-brand-black')}>
                    <t.icon className="h-5 w-5" />
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {drawer && <ProfileDrawer open onClose={() => setDrawer(false)} />}
    </div>
  );
}
