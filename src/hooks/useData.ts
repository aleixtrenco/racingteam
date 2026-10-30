// All data access goes through these hooks. Races and registrations are each fetched
// once and shared by every screen via the query cache, which keeps the number of
// requests on app start to two.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isDemo, supabase } from '@/lib/supabase';
import type { Profile, Race, RaceResult, Registration, Sponsor } from '@/lib/types';

const unwrap = <T,>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

export const keys = {
  races: ['races'] as const,
  registrations: ['registrations'] as const,
  results: ['results'] as const,
  sponsors: ['sponsors'] as const,
  profiles: ['profiles'] as const,
};

export const useRaces = () =>
  useQuery({
    queryKey: keys.races,
    queryFn: async () => unwrap<Race[]>(await supabase.from('races').select('*').order('race_date')),
  });

export const useRegistrations = () =>
  useQuery({
    queryKey: keys.registrations,
    queryFn: async () =>
      unwrap<Registration[]>(await supabase.from('registrations').select('*').order('created_at')),
  });

export const useResults = () =>
  useQuery({
    queryKey: keys.results,
    queryFn: async () =>
      unwrap<RaceResult[]>(
        await supabase.from('race_results').select('*').order('race_date', { ascending: false }).order('overall_position', { nullsFirst: false }),
      ),
  });

export const useSponsors = () =>
  useQuery({
    queryKey: keys.sponsors,
    staleTime: 60 * 60_000,
    queryFn: async () => unwrap<Sponsor[]>(await supabase.from('sponsors').select('*').order('tier').order('display_order')),
  });

/** Team members (admin tools: athlete picker, participation). */
export const useProfiles = (enabled = true) =>
  useQuery({
    queryKey: keys.profiles,
    enabled,
    queryFn: async () => unwrap<Profile[]>(await supabase.from('profiles').select('id, full_name, email, role').order('full_name')),
  });

// ---- mutations -------------------------------------------------------------

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { raceId: string; userId: string; note?: string }) =>
      unwrap(await supabase.from('registrations').insert({ race_id: v.raceId, user_id: v.userId, note: v.note || null }).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.registrations }),
  });
}

export function useUnregister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (registrationId: string) => {
      const { error, count } = await supabase.from('registrations').delete({ count: 'exact' }).eq('id', registrationId);
      if (error) throw new Error(error.message);
      if (!count) throw new Error('Registration could not be removed: the deadline may have passed.');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.registrations }),
  });
}

export type RaceInput = Omit<Race, 'id'>;

export function useSaveRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...race }: RaceInput & { id?: string }) =>
      id
        ? unwrap(await supabase.from('races').update(race).eq('id', id).select().single())
        : unwrap(await supabase.from('races').insert(race).select().single()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.races });
      qc.invalidateQueries({ queryKey: keys.registrations });
      qc.invalidateQueries({ queryKey: keys.results });
    },
  });
}

/** Quick edits from the admin list (status, priority, team-entry flag). */
export function usePatchRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<RaceInput> & { id: string }) =>
      unwrap(await supabase.from('races').update(patch).eq('id', id).select().single()),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: keys.races });
      const prev = qc.getQueryData<Race[]>(keys.races);
      qc.setQueryData<Race[]>(keys.races, (rs) => rs?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(keys.races, ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.races }),
  });
}

export function useDeleteRace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('races').delete().eq('id', id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.races });
      qc.invalidateQueries({ queryKey: keys.registrations });
    },
  });
}

export type ResultInput = Pick<RaceResult, 'race_id' | 'athlete_name' | 'overall_position' | 'result_text' | 'notes' | 'photos'> & {
  user_id?: string | null;
};

export function useSaveResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...result }: ResultInput & { id?: string }) =>
      id
        ? unwrap(await supabase.from('race_results').update(result).eq('id', id).select().single())
        : unwrap(await supabase.from('race_results').insert(result).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.results }),
  });
}

export type ResultRow = ResultInput & { id?: string };

/** Admin results entry: save a whole race's results in one go (updates existing rows, inserts new ones). */
export function useSaveResultsBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: ResultRow[]) => {
      const updates = rows.filter((r) => r.id);
      const inserts = rows.filter((r) => !r.id).map(({ id: _id, ...r }) => r);
      for (const { id, ...r } of updates) unwrap(await supabase.from('race_results').update(r).eq('id', id!));
      if (inserts.length) unwrap(await supabase.from('race_results').insert(inserts));
      return rows.length;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.results }),
  });
}

export function useDeleteResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: RaceResult) => {
      if (r.photos.length) await supabase.storage.from(PHOTO_BUCKET).remove(r.photos);
      unwrap(await supabase.from('race_results').delete().eq('id', r.id));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.results }),
  });
}

// ---- sponsors --------------------------------------------------------------

export type SponsorInput = Omit<Sponsor, 'id'> & { id?: string };

export function useSaveSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...sponsor }: SponsorInput) =>
      id
        ? unwrap(await supabase.from('sponsors').update(sponsor).eq('id', id).select().single())
        : unwrap(await supabase.from('sponsors').insert(sponsor).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sponsors }),
  });
}

export function useDeleteSponsor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unwrap(await supabase.from('sponsors').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sponsors }),
  });
}

export const SPONSOR_BUCKET = 'sponsor-logos';

export async function uploadSponsorLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(SPONSOR_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  if (isDemo) return (window as unknown as { __demoPhotoUrl: (p: string) => string }).__demoPhotoUrl(path);
  return supabase.storage.from(SPONSOR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Logos bundled with the app are stored as relative paths; uploads are full URLs. */
export const logoSrc = (url: string | null) => (!url ? null : /^(https?:|data:|blob:)/.test(url) ? url : `${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`);

// ---- photos ----------------------------------------------------------------

export const PHOTO_BUCKET = 'recap-photos';

/** Time-limited links for private photos, fetched in one request per batch. */
export function useSignedUrls(paths: string[]) {
  return useQuery({
    queryKey: ['signed', ...paths],
    enabled: paths.length > 0,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      if (isDemo) {
        const local = (window as unknown as { __demoPhotoUrl?: (p: string) => string | undefined }).__demoPhotoUrl;
        return Object.fromEntries(paths.map((p) => [p, local?.(p)]).filter(([, u]) => u)) as Record<string, string>;
      }
      const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
      if (error) throw error;
      return Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])) as Record<string, string>;
    },
  });
}

/** Downscale photos on the phone before upload: faster uploads and lighter pages. */
async function compress(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/heic') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((res) => canvas.toBlob((b) => res(b ?? file), 'image/jpeg', quality));
  } catch {
    return file;
  }
}

export async function uploadPhotos(userId: string, files: File[]): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const blob = await compress(file);
    const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'jpg');
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type || file.type });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    paths.push(path);
  }
  return paths;
}

export async function deleteMyAccount(userId: string) {
  // Remove the user's own photo files, then their rows and the account itself.
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(userId, { limit: 1000 });
  if (files?.length) await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${userId}/${f.name}`));
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
}
