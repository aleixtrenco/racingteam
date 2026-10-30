import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, Handshake, Trophy, Users } from 'lucide-react';
import { cx } from '@/components/ui';

const sections = [
  { to: '/admin', label: 'Races', icon: CalendarDays, end: true },
  { to: '/admin/results', label: 'Results', icon: Trophy },
  { to: '/admin/sponsors', label: 'Sponsors', icon: Handshake },
  { to: '/admin/athletes', label: 'Athletes', icon: Users },
];

export default function AdminLayout() {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">Team admin</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Manage the season</h1>
      </div>
      <nav aria-label="Admin sections" className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 -mx-4 mb-5 border-b border-neutral-200 bg-paper/95 px-4 backdrop-blur dark:border-neutral-800 dark:bg-brand-black/95 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
        <div className="grid grid-cols-4 gap-1 py-2 sm:inline-flex sm:rounded-full sm:bg-white sm:p-1 sm:shadow-lift sm:ring-1 sm:ring-neutral-200 dark:sm:bg-neutral-900 dark:sm:ring-neutral-800">
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                cx(
                  'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-bold transition sm:min-h-[40px] sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-4 sm:text-sm',
                  isActive ? 'bg-brand-black text-white dark:bg-brand-yellow dark:text-brand-black' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
                )
              }
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
