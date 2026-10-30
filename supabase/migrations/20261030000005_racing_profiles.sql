-- Racing profiles: every athlete gets a profile page with their disciplines,
-- kit size, links and results. Google sign-ups get their name and photo automatically.

alter table public.profiles
  add column if not exists avatar_url   text,
  add column if not exists disciplines  text[] not null default '{}',
  add column if not exists tshirt_size  text check (tshirt_size is null or tshirt_size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  add column if not exists bio          text check (bio is null or char_length(bio) <= 280),
  add column if not exists strava_url   text,
  add column if not exists instagram    text,
  add column if not exists onboarded_at timestamptz;

alter table public.profiles
  add constraint profiles_disciplines_valid check (disciplines <@ array['Road', 'Mountainbike', 'Triathlon']::text[]);

-- Fill name and photo from the sign-up (email form or Google).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end $$;

-- Existing accounts that signed in with Google before this migration.
update public.profiles p
set avatar_url = coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
where u.id = p.id and p.avatar_url is null;

-- Athletes may edit their own profile fields (never role or email).
grant update (full_name, avatar_url, disciplines, tshirt_size, bio, strava_url, instagram, onboarded_at) on public.profiles to authenticated;

-- Profile photos uploaded in the app (Google photos are linked directly).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
