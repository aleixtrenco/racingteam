import { useAuth } from '@/hooks/useAuth';
import { useSaveProfile } from '@/hooks/useData';
import { Logo } from '@/components/Logo';
import { ProfileForm } from '@/components/ProfileForm';

/** First sign-in (Google or email): set up the athlete's racing profile. */
export default function Onboarding() {
  const { profile, refreshProfile } = useAuth();
  const skip = useSaveProfile();
  if (!profile) return null;
  const first = profile.full_name.split(' ')[0];

  const later = async () => {
    await skip.mutateAsync({ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url, disciplines: profile.disciplines ?? [], tshirt_size: profile.tshirt_size, bio: profile.bio, strava_url: profile.strava_url, instagram: profile.instagram, onboarded_at: new Date().toISOString() });
    await refreshProfile();
  };

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <div className="relative overflow-hidden px-6 pb-16 pt-[calc(2.5rem+env(safe-area-inset-top))]">
        <div aria-hidden className="absolute -right-10 -top-10 h-[230px] w-[120px] skew-x-[-18deg] bg-brand-yellow sm:-right-24 sm:w-[30%]" />
        <div aria-hidden className="absolute -right-10 -top-10 h-[230px] w-[120px] -translate-x-[30px] skew-x-[-18deg] border-l-[8px] border-white/90 sm:-right-24 sm:w-[30%]" />
        <div className="relative mx-auto max-w-lg pr-24 sm:pr-0">
          <Logo white className="h-12" />
          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-yellow">Welcome to the team</p>
          <h1 className="mt-2 text-balance text-3xl font-extrabold leading-tight sm:text-4xl">Set up your racing profile, {first}</h1>
          <p className="mt-2 max-w-md text-[15px] text-neutral-300">Teammates see your profile on start lists, results and the ranking. It takes a minute, and you can change it any time.</p>
        </div>
      </div>
      <div className="-mt-8 rounded-t-[28px] bg-white px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 text-brand-black dark:bg-neutral-900 dark:text-white sm:mx-auto sm:mb-16 sm:max-w-lg sm:rounded-[28px] sm:pb-8">
        <ProfileForm profile={profile} submitLabel="Save and continue" onDone={() => undefined} markOnboarded />
        <button onClick={later} disabled={skip.isPending} className="mt-2 min-h-touch w-full text-sm font-bold text-neutral-500">
          Skip for now
        </button>
      </div>
    </div>
  );
}
