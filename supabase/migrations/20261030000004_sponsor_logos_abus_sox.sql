-- Logos for ABUS and Sox Footwear, and the Sox website.
update public.sponsors set logo_url = 'sponsors/abus.webp' where name = 'ABUS';
update public.sponsors set logo_url = 'sponsors/sox.webp', website = 'https://www.soxfootwear.com' where name = 'Sox';
