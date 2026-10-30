import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { isDemo } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Spinner } from '@/components/ui';
import Login from '@/pages/Login';
import Home from '@/pages/Home';

// Home and Login ship in the main bundle; everything else loads on demand.
const Calendar = lazy(() => import('@/pages/Calendar'));
const RaceDetail = lazy(() => import('@/pages/RaceDetail'));
const MyRaces = lazy(() => import('@/pages/MyRaces'));
const Results = lazy(() => import('@/pages/Results'));
const Ranking = lazy(() => import('@/pages/Ranking'));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminRaces = lazy(() => import('@/pages/admin/AdminRaces'));
const AdminResults = lazy(() => import('@/pages/admin/AdminResults'));
const AdminSponsors = lazy(() => import('@/pages/admin/AdminSponsors'));
const AdminAthletes = lazy(() => import('@/pages/admin/AdminAthletes'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

// The sample-data preview runs inside an embedded frame, where the URL path isn't ours.
const Router = isDemo ? MemoryRouter : BrowserRouter;

const AdminOnly = ({ children }: { children: ReactNode }) => {
  const { isAdmin, profile } = useAuth();
  if (!profile) return <Spinner />;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

export default function App() {
  const { session, loading } = useAuth();

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <div className="h-1 w-16 animate-pulse rounded-full bg-brand-yellow" />
      </div>
    );

  return (
    <Router>
      {!session ? (
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      ) : (
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="races/:id" element={<RaceDetail />} />
              <Route path="my-races" element={<MyRaces />} />
              <Route path="results" element={<Results />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="admin" element={<AdminOnly><AdminLayout /></AdminOnly>}>
                <Route index element={<AdminRaces />} />
                <Route path="results" element={<AdminResults />} />
                <Route path="sponsors" element={<AdminSponsors />} />
                <Route path="athletes" element={<AdminAthletes />} />
                <Route path="participation" element={<Navigate to="/admin/athletes" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      )}
    </Router>
  );
}
