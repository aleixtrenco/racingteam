-- Wolfi's Racing Team: schema, security rules and storage.
-- Business rules enforced here (not just in the UI):
--   * registration closes 3 days before the race (team time zone, Asia/Dubai)
--   * team-entry-only and cancelled races cannot be joined individually
--   * athletes manage only their own registrations / results; admins manage everything

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users (profiles mirror auth.users and carry the role)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null default '',
  role        text not null default 'athlete' check (role in ('athlete', 'admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Today's date in the team's time zone; registration_open() compares against it.
create or replace function public.team_today()
returns date language sql stable as $$
  select (now() at time zone 'Asia/Dubai')::date;
$$;

-- Registration is open up to and including the day that is 3 days before the race.
create or replace function public.registration_open(p_race_date date)
returns boolean language sql stable as $$
  select public.team_today() <= p_race_date - 3;
$$;

-- ---------------------------------------------------------------------------
-- Races
-- ---------------------------------------------------------------------------
create table public.races (
  id                   uuid primary key default gen_random_uuid(),
  event_name           text not null,
  race_date            date not null,
  location             text,
  status               text not null default 'Tentative' check (status in ('Confirmed', 'Tentative', 'Cancelled')),
  priority             text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  discipline           text not null default 'Road' check (discipline in ('Road', 'Mountainbike', 'Triathlon')),
  athletes_racing_note text,
  team_entry_only      boolean not null default false,
  external_id          text unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index races_date_idx on public.races (race_date);

-- ---------------------------------------------------------------------------
-- Registrations
-- ---------------------------------------------------------------------------
create table public.registrations (
  id             uuid primary key default gen_random_uuid(),
  race_id        uuid not null references public.races (id) on delete cascade,
  race_name      text not null default '',
  race_date      date,
  user_id        uuid references public.profiles (id) on delete cascade,
  athlete_name   text not null default '',
  athlete_email  text not null default '',
  note           text,
  recap_sent     boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (race_id, user_id)
);
create index registrations_user_idx on public.registrations (user_id);
create index registrations_race_idx on public.registrations (race_id);

-- ---------------------------------------------------------------------------
-- Race results / recaps
-- ---------------------------------------------------------------------------
create table public.race_results (
  id                uuid primary key default gen_random_uuid(),
  race_id           uuid references public.races (id) on delete set null,
  race_name         text not null default '',
  race_date         date,
  user_id           uuid references public.profiles (id) on delete cascade,
  athlete_name      text not null,
  overall_position  integer check (overall_position is null or overall_position > 0),
  result_text       text,
  notes             text,
  photos            text[] not null default '{}',  -- storage paths in the private recap-photos bucket
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index race_results_race_idx on public.race_results (race_id);
create index race_results_date_idx on public.race_results (race_date desc);

-- ---------------------------------------------------------------------------
-- Sponsors
-- ---------------------------------------------------------------------------
create table public.sponsors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  logo_url       text,
  website        text,
  tier           smallint not null default 2 check (tier in (1, 2)),
  display_order  integer not null default 0
);

insert into public.sponsors (name, website, tier, display_order) values
  ('Skoda',     'https://www.skoda-auto.com', 1, 1),
  ('Breitling', 'https://www.breitling.com',  1, 2),
  ('Lake',      'https://www.lakecycling.com', 2, 3),
  ('ABUS',      'https://www.abus.com',       2, 4),
  ('Scicon',    'https://www.sciconsports.com', 2, 5),
  ('Sox',       null,                         2, 6);

-- ---------------------------------------------------------------------------
-- Denormalised fields are filled from the source rows so clients cannot spoof them
-- ---------------------------------------------------------------------------
create or replace function public.fill_race_fields()
returns trigger language plpgsql security definer set search_path = public as $$
declare r public.races;
begin
  if new.race_id is not null then
    select * into r from public.races where id = new.race_id;
    if found then
      new.race_name := r.event_name;
      new.race_date := r.race_date;
    end if;
  end if;
  return new;
end $$;

create or replace function public.fill_registration_athlete()
returns trigger language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if new.user_id is not null then
    select * into p from public.profiles where id = new.user_id;
    if found then
      new.athlete_name := p.full_name;
      new.athlete_email := p.email;
    end if;
  end if;
  return new;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger registrations_fill_race before insert on public.registrations
  for each row execute function public.fill_race_fields();
create trigger registrations_fill_athlete before insert on public.registrations
  for each row execute function public.fill_registration_athlete();
create trigger race_results_fill_race before insert or update of race_id on public.race_results
  for each row execute function public.fill_race_fields();
create trigger races_touch before update on public.races
  for each row execute function public.touch_updated_at();
create trigger race_results_touch before update on public.race_results
  for each row execute function public.touch_updated_at();

-- Keep copies of the race name/date in sync when an admin edits a race.
create or replace function public.propagate_race_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.event_name is distinct from old.event_name or new.race_date is distinct from old.race_date then
    update public.registrations set race_name = new.event_name, race_date = new.race_date where race_id = new.id;
    update public.race_results  set race_name = new.event_name, race_date = new.race_date where race_id = new.id;
  end if;
  return new;
end $$;

create trigger races_propagate after update on public.races
  for each row execute function public.propagate_race_changes();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.races         enable row level security;
alter table public.registrations enable row level security;
alter table public.race_results  enable row level security;
alter table public.sponsors      enable row level security;

-- profiles: everyone signed in can see names (registered-athlete lists); users edit only their name.
-- Roles are changed by an admin in the Supabase dashboard (see README).
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- races
create policy races_read on public.races for select to authenticated using (true);
create policy races_admin_write on public.races for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- registrations
create policy registrations_read on public.registrations for select to authenticated using (true);
create policy registrations_insert_self on public.registrations for insert to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.races r
        where r.id = race_id
          and not r.team_entry_only
          and r.status <> 'Cancelled'
          and public.registration_open(r.race_date)
      )
    )
  );
create policy registrations_delete_self on public.registrations for delete to authenticated
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (select 1 from public.races r where r.id = race_id and public.registration_open(r.race_date))
    )
  );
create policy registrations_admin_update on public.registrations for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- race results
create policy results_read on public.race_results for select to authenticated using (true);
create policy results_insert on public.race_results for insert to authenticated
  with check (user_id = auth.uid() or public.is_admin());
create policy results_update on public.race_results for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy results_delete on public.race_results for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- sponsors
create policy sponsors_read on public.sponsors for select to anon, authenticated using (true);
create policy sponsors_admin_write on public.sponsors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Private photo storage (shown in the app via time-limited signed URLs)
-- Paths are "<user id>/<file>" so ownership can be checked from the path.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recap-photos', 'recap-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy recap_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'recap-photos');
create policy recap_photos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'recap-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy recap_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'recap-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Account deletion: removes the caller's registrations and results, then the account.
-- (The app deletes the caller's photo files through the storage API first.)
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from public.registrations where user_id = uid;
  delete from public.race_results  where user_id = uid;
  delete from auth.users where id = uid;  -- cascades to profiles
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
