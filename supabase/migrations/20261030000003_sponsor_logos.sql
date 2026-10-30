-- Sponsor logos and links. Logos shipped with the app live in /public/sponsors
-- (stored as relative paths); logos uploaded by admins go to the public sponsor-logos bucket.

update public.sponsors set logo_url = 'sponsors/skoda.webp',     website = 'https://www.skoda-auto.com'   where name = 'Skoda';
update public.sponsors set logo_url = 'sponsors/breitling.webp', website = 'https://www.breitling.com'    where name = 'Breitling';
update public.sponsors set logo_url = 'sponsors/lake.webp',      website = 'https://www.lakecycling.com'  where name = 'Lake';
update public.sponsors set logo_url = 'sponsors/scicon.webp',    website = 'https://www.sciconsports.com' where name = 'Scicon';
update public.sponsors set website = 'https://www.abus.com' where name = 'ABUS';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsor-logos', 'sponsor-logos', true, 2097152, array['image/png', 'image/webp', 'image/svg+xml', 'image/jpeg'])
on conflict (id) do nothing;

create policy sponsor_logos_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'sponsor-logos');
create policy sponsor_logos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sponsor-logos' and public.is_admin());
create policy sponsor_logos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sponsor-logos' and public.is_admin());
