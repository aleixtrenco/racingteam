-- Automations: database events call Edge Functions, and a weekly job sends recap reminders.
--
-- Before running this migration, store two secrets in Supabase Vault (SQL editor):
--   select vault.create_secret('https://YOUR-PROJECT.supabase.co', 'project_url');
--   select vault.create_secret('<long random string>',            'functions_secret');
-- and set the same functions_secret as WEBHOOK_SECRET for the Edge Functions (see README).

create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function public.call_edge_function(fn text, payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  base   text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'functions_secret');
begin
  if base is null or secret is null then
    raise warning 'Automations not configured: missing project_url / functions_secret in Vault';
    return;
  end if;
  perform net.http_post(
    url     := base || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body    := payload
  );
end $$;

revoke all on function public.call_edge_function(text, jsonb) from public, anon, authenticated;

-- 1 + 2. Registration → Google Sheet + confirmation email
create or replace function public.on_registration_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('on-registration', jsonb_build_object('record', to_jsonb(new)));
  return new;
end $$;

create trigger registrations_automation after insert on public.registrations
  for each row execute function public.on_registration_created();

-- 3. New recap → Google Sheet + photos to Google Drive
create or replace function public.on_result_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_edge_function('on-result', jsonb_build_object('record', to_jsonb(new)));
  return new;
end $$;

create trigger race_results_automation after insert on public.race_results
  for each row execute function public.on_result_created();

-- 4. Recap reminder: Mondays 09:00 Dubai time (05:00 UTC), after race weekend.
select cron.schedule(
  'race-recap-reminder',
  '0 5 * * 1',
  $$ select public.call_edge_function('recap-reminder', '{}'::jsonb); $$
);
