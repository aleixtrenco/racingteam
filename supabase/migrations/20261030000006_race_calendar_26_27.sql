-- 2026/27 race calendar, imported from "Wolfis Racing Team 26_27 Race Calendar.xlsx".
-- Mapping from the sheet: Cycling → Road, MTB → Mountainbike, Aquathlon → Triathlon, TBC → Tentative.
-- Multi-day events keep their last day in end_date (registration still closes 3 days before the first day).
-- Not imported: "Al Salam Championship" (date TBC). Add it in Admin → Races once the date is known.
-- "Falcon Daman Series Al Ain 2" had no details on the sheet: imported as Al Ain / Road / Medium / Tentative.
-- Re-running is safe: races are matched on external_id and updated in place.

alter table public.races add column if not exists end_date date;
do $$ begin
  alter table public.races add constraint races_end_after_start check (end_date is null or end_date >= race_date);
exception when duplicate_object then null;
end $$;

insert into public.races (event_name, race_date, end_date, location, status, priority, discipline, athletes_racing_note, team_entry_only, external_id) values
  ('Spinneys Build Up Ride 1', '2026-09-13', null, 'Dubai', 'Confirmed', 'High', 'Road', null, false, 'wrt2627-2026-09-13-spinneys-build-up-ride-1'),
  ('Al Ain Cycle Race', '2026-10-03', null, 'Al Ain', 'Confirmed', 'Low', 'Road', null, false, 'wrt2627-2026-10-03-al-ain-cycle-race'),
  ('RAK Mountain Bike Race', '2026-10-04', null, 'RAK', 'Confirmed', 'Medium', 'Mountainbike', 'Glen Impey, Glenn Tamoy', false, 'wrt2627-2026-10-04-rak-mountain-bike-race'),
  ('Proud of UAE Race', '2026-10-04', null, 'Dubai', 'Confirmed', 'High', 'Road', 'Chris, Gavin, Erwan, Hassan, Aurora, Nicolas', false, 'wrt2627-2026-10-04-proud-of-uae-race'),
  ('Falcon Daman Series Race 1/6', '2026-10-06', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Erwan, Chris, Darcey, Gavin, Bart and Andrew K', false, 'wrt2627-2026-10-06-falcon-daman-series-race-1-6'),
  ('Mleiha Mountain Bike challenge', '2026-10-11', null, 'Mleiha', 'Confirmed', 'Medium', 'Mountainbike', 'Clive, Glen, Glenn', false, 'wrt2627-2026-10-11-mleiha-mountain-bike-challenge'),
  ('Dubai Police Triathlon', '2026-10-11', null, 'Dubai', 'Confirmed', 'Medium', 'Triathlon', 'Jamie Edmunds', false, 'wrt2627-2026-10-11-dubai-police-triathlon'),
  ('UAE Tour Challenge Age Group', '2026-10-17', null, 'Al Wathba Track', 'Confirmed', 'Medium', 'Road', null, false, 'wrt2627-2026-10-17-uae-tour-challenge-age-group'),
  ('Spinneys Build Up Ride 2', '2026-10-18', null, 'Dubai', 'Confirmed', 'High', 'Road', 'Seba, Andrew K. Chris', false, 'wrt2627-2026-10-18-spinneys-build-up-ride-2'),
  ('Ajman Triathlon', '2026-10-18', null, 'Ajman', 'Confirmed', 'Low', 'Triathlon', 'Kristian', false, 'wrt2627-2026-10-18-ajman-triathlon'),
  ('Hudayriyat Women’s Cycling Series - Race 1/4', '2026-10-25', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Seba, Alison', false, 'wrt2627-2026-10-25-hudayriyat-women-s-cycling-series-race-1-4'),
  ('Mamzar Triathlon', '2026-10-25', null, 'Dubai', 'Confirmed', 'Low', 'Triathlon', 'Jamie, Gemma Kristian', false, 'wrt2627-2026-10-25-mamzar-triathlon'),
  ('Masfout Mountain Bike Challenge', '2026-10-25', null, 'Ajman', 'Confirmed', 'Medium', 'Mountainbike', 'Phil, Clive, Glenn', false, 'wrt2627-2026-10-25-masfout-mountain-bike-challenge'),
  ('Khorfakkan Clouds Cycling Race', '2026-10-31', null, 'Khorfakkan', 'Confirmed', 'Medium', 'Road', 'Andrew K. Alison', false, 'wrt2627-2026-10-31-khorfakkan-clouds-cycling-race'),
  ('Open Masters Games Aquathlon', '2026-11-01', null, null, 'Confirmed', 'Low', 'Triathlon', null, false, 'wrt2627-2026-11-01-open-masters-games-aquathlon'),
  ('Falcon Daman Series Race 2/6', '2026-11-03', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Andrew K.Alison', false, 'wrt2627-2026-11-03-falcon-daman-series-race-2-6'),
  ('Liwa Challenge Race', '2026-11-08', null, 'Liwa', 'Confirmed', 'Low', 'Road', null, false, 'wrt2627-2026-11-08-liwa-challenge-race'),
  ('Hudayriyat Women’s Cycling Series - Race 2/4', '2026-11-08', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Seba, Alison', false, 'wrt2627-2026-11-08-hudayriyat-women-s-cycling-series-race-2-4'),
  ('TrailSeeker Mushrif Park', '2026-11-08', null, 'Dubai', 'Tentative', 'High', 'Mountainbike', 'Andrew K., Glen Impey', false, 'wrt2627-2026-11-08-trailseeker-mushrif-park'),
  ('Falcon Daman Series Al Ain 1', '2026-11-12', null, 'Al Ain', 'Confirmed', 'Medium', 'Road', null, false, 'wrt2627-2026-11-12-falcon-daman-series-al-ain-1'),
  ('T100 Dubai', '2026-11-12', '2026-11-15', 'Dubai', 'Confirmed', 'High', 'Triathlon', 'Kristian', false, 'wrt2627-2026-11-12-t100-dubai'),
  ('World Triathlon Multisport Championship', '2026-11-13', '2026-11-22', 'Hudayriyat', 'Confirmed', 'High', 'Triathlon', null, false, 'wrt2627-2026-11-13-world-triathlon-multisport-championship'),
  ('Spinneys Build Up Ride 3', '2026-11-22', null, 'Dubai', 'Confirmed', 'High', 'Road', 'Andrew K.', false, 'wrt2627-2026-11-22-spinneys-build-up-ride-3'),
  ('UAE Tour Challenge Hafeet Race 3', '2026-11-28', null, 'Al Ain, Hafeet', 'Confirmed', 'Medium', 'Road', null, false, 'wrt2627-2026-11-28-uae-tour-challenge-hafeet-race-3'),
  ('Hudayriyat Women’s Cycling Series - Race 3/4', '2026-11-29', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Seba, Alison', false, 'wrt2627-2026-11-29-hudayriyat-women-s-cycling-series-race-3-4'),
  ('Falcon Daman Series Race 3/6', '2026-12-01', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Chris, Alison', false, 'wrt2627-2026-12-01-falcon-daman-series-race-3-6'),
  ('Muscat MTB Ride', '2026-12-05', null, 'Muscat, Oman', 'Confirmed', 'Low', 'Mountainbike', 'Phil, Andrew K.Glen Impey', false, 'wrt2627-2026-12-05-muscat-mtb-ride'),
  ('Hudayriyat Women’s Cycling Series - Race 4/4', '2026-12-06', null, 'Hudayriyat', 'Confirmed', 'Medium', 'Road', 'Seba, Alison', false, 'wrt2627-2026-12-06-hudayriyat-women-s-cycling-series-race-4-4'),
  ('Bike Abu Dhabi Gran Fondo', '2026-12-20', null, 'Al Ain - Wathba', 'Confirmed', 'High', 'Road', 'Andrew K. Chris, Ahmed, Kyan, Bart,Seba, Alison', false, 'wrt2627-2026-12-20-bike-abu-dhabi-gran-fondo'),
  ('Spinneys Build Up Ride 4', '2027-01-09', null, 'Dubai', 'Confirmed', 'High', 'Road', 'Andrew K. Chris', false, 'wrt2627-2027-01-09-spinneys-build-up-ride-4'),
  ('Falcon Daman Series Al Ain 2', '2027-01-14', null, 'Al Ain', 'Tentative', 'Medium', 'Road', null, false, 'wrt2627-2027-01-14-falcon-daman-series-al-ain-2'),
  ('L''Etape Dubai', '2027-01-24', null, 'Dubai', 'Tentative', 'High', 'Road', 'Chris, Alison', false, 'wrt2627-2027-01-24-l-etape-dubai'),
  ('CSBY', '2027-01-30', '2027-01-31', 'Sir Bani Yas', 'Tentative', 'High', 'Triathlon', null, false, 'wrt2627-2027-01-30-csby'),
  ('Spinneys 92 Main Event', '2027-02-07', null, 'Dubai', 'Confirmed', 'High', 'Road', 'Andrew K. Chris, Alison', false, 'wrt2627-2027-02-07-spinneys-92-main-event'),
  ('TriYas', '2027-02-13', null, 'Yas Island', 'Confirmed', 'Medium', 'Triathlon', 'Alison', false, 'wrt2627-2027-02-13-triyas'),
  ('Falcon Daman Series Al Ain 3', '2027-03-11', null, 'Al Ain Track', 'Confirmed', 'Medium', 'Road', null, false, 'wrt2627-2027-03-11-falcon-daman-series-al-ain-3')
on conflict (external_id) do update set
  event_name = excluded.event_name,
  race_date = excluded.race_date,
  end_date = excluded.end_date,
  location = excluded.location,
  status = excluded.status,
  priority = excluded.priority,
  discipline = excluded.discipline,
  athletes_racing_note = excluded.athletes_racing_note;
