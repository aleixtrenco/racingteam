# Wolfi's Racing Team: athlete portal

Race calendar, self-service registration, deadlines, recaps with photos, results archive, season ranking and admin tools for Wolfi's Racing Team. One codebase runs as a mobile-first web app and as a native iOS/Android app (Capacitor).

**Stack:** React 18 + TypeScript + Tailwind (Vite) · Supabase (Auth, Postgres with row-level security, private Storage, Edge Functions, pg_cron) · TanStack Query · Capacitor 6.

---

## 1. Run it locally

```bash
npm install
cp .env.example .env      # fill in your Supabase URL + anon key and the team manager's email
npm run dev               # http://localhost:5173
npm test                  # deadline + ranking rules
```

## 2. Set up Supabase (one-off, ~20 min)

1. Create a project at [supabase.com](https://supabase.com). Region: one close to the UAE (e.g. Mumbai or Frankfurt).
2. **Database:** run the files in `supabase/migrations/` in order. You can paste them into the SQL editor or use `supabase db push`.
   - `…_init.sql`: tables, security rules, the private `recap-photos` bucket, account deletion and sponsor seed data.
   - `…_automations.sql`: first create the two Vault secrets described at the top of that file, then run it.
   - `…_sponsor_logos.sql` and `…_sponsor_logos_abus_sox.sql`: sponsor logos and websites, plus the logo upload bucket.
   - `…_racing_profiles.sql`: racing profile fields, the Google photo on sign-up, and the profile photo bucket.
3. **Google sign-up / sign-in.** Anyone on the team can join with one tap, and their racing profile is created on first sign-in.
   1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), go to **Create credentials → OAuth client ID → Web application**.
   2. Under **Authorised redirect URIs**, add `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   3. On the **OAuth consent screen**, set the app name to "Wolfi's Racing Team", add the logo, and publish it, so people outside your Google Workspace can sign in.
   4. In **Supabase → Authentication → Providers → Google**, turn it on and paste the client ID and secret.

   Email + password stays available for anyone without Google.
   - **Auth → URL configuration:** add your site URL (e.g. `https://racing.wolfis.ae`) and `http://localhost:5173` as redirect URLs.
4. **Make yourself admin.** Sign up in the app, then run:
   ```sql
   update profiles set role = 'admin' where email = 'you@wolfis.ae';
   ```
5. **Edge Functions (automations):**
   ```bash
   supabase link --project-ref <ref>
   cp supabase/functions/.env.example supabase/functions/.env   # fill in
   supabase secrets set --env-file supabase/functions/.env
   supabase functions deploy on-registration
   supabase functions deploy on-result
   supabase functions deploy recap-reminder
   ```
   - **Email:** create a [Resend](https://resend.com) account, verify the `wolfis.ae` domain and set `RESEND_API_KEY`.
   - **Google Sheet / Drive:** create a Google Cloud service account and download its JSON key into `GOOGLE_SERVICE_ACCOUNT`. Share the Sheet and the Drive folder with the service account's email as **Editor**. The Sheet needs two tabs, `Registrations` and `Recaps`. Set `GOOGLE_SHEET_ID` and `GOOGLE_DRIVE_FOLDER_ID`.

## 3. Move the data from Base44

Export each Base44 entity to CSV and import it in **Supabase → Table editor → Import data**. Rename the columns to match:

| Base44 entity | Supabase table | Notes |
|---|---|---|
| Race | `races` | `event_name, race_date (yyyy-mm-dd), location, status, priority, discipline, athletes_racing_note, team_entry_only, external_id` |
| Registration | `registrations` | Import races first. `race_id` must be the **new** race id, so match on race name + date in a spreadsheet first. `user_id` can be left empty for historic rows. |
| RaceResult | `race_results` | Same as registrations. Leave `photos` empty, or re-upload the photos through the app. |
| Sponsor | `sponsors` | Already seeded with the six sponsors. Add `logo_url`s. |

Athletes then sign up again with the same email, or with Google. Passwords can't be exported from Base44.

## 4. Brand assets

Already in the app:

| File | What |
|---|---|
| `public/brand/logo.webp` (+ `logo.png`) | Official Wolfi's Racing Team logo, black on transparent. Turned white automatically on dark surfaces. |
| `public/brand/emblem.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon.png` | Chain-link emblem, the app icon (black on yellow) and the favicon |
| `public/sponsors/{skoda,breitling,lake,scicon}.webp` | Sponsor logos with transparent backgrounds |

Still to add:

| File | What |
|---|---|
| `public/brand/hero.jpg` | The team photo from the [Wolfi's Racing Team page](https://wolfis.ae/pages/wolfisracingteam), used behind the Home banner. **Keep it under ~200 KB** (1600 px wide, JPEG quality ~75). |
| `public/brand/kit-2026.png` | 2026 kit mockup (desktop only). The card stays hidden until it exists. |
| `public/fonts/Gilroy-{Regular,Medium,Bold,ExtraBold}.woff2` | Licensed Gilroy. Until it's added, the app uses Outfit from Google Fonts. |

## 5. Deploy

- **Web:** `npm run build` and host `dist/` on Vercel, Netlify or Cloudflare Pages, with an SPA fallback to `index.html`. Set the `VITE_*` env vars in the host.
- **Native apps:**
  ```bash
  npx cap add ios && npx cap add android    # first time only (needs Xcode / Android Studio)
  npm run cap:sync
  npm run cap:ios      # or cap:android
  ```
  **Google sign-in in the native app** is handled in `src/lib/oauth.ts`. It opens Google in an in-app browser and finishes on the deep link `ae.wolfis.racingteam://auth-callback`. To make that work:
  - Add `ae.wolfis.racingteam://auth-callback` to **Supabase → Auth → URL configuration → Redirect URLs**.
  - iOS: in Xcode, add the URL scheme `ae.wolfis.racingteam` under **Target → Info → URL Types**.
  - Android: add an intent filter for scheme `ae.wolfis.racingteam`, host `auth-callback`, to `MainActivity` in `AndroidManifest.xml`.

---

## How it maps to the brief

| Brief | Where |
|---|---|
| Roles, permissions | `profiles.role` plus the row-level security policies in `…_init.sql`. Rules are enforced in the database, not just hidden in the UI. |
| Registration closes 3 days before | `registration_open()` (SQL) and `src/lib/dates.ts`, both using Dubai time |
| Team-entry-only / cancelled races | RLS insert policy plus the race detail notices. Admins get a "Message Aleix" pre-filled email. |
| Ranking 3/2/1, overall only | `src/lib/ranking.ts` (unit-tested) |
| Private photos via time-limited links | `recap-photos` bucket plus `createSignedUrls` (one request per page) |
| Account deletion | Profile drawer → `delete_my_account()` (photos, registrations, results, then the account itself) |
| Automations 1–4 | `supabase/functions/*` triggered from the database. Recap reminder: Mondays 09:00 Dubai. |
| Racing profiles | Google or email sign-up, then a welcome screen to set up the profile (photo, disciplines, kit size, bio, Strava, Instagram). Each athlete has a page at `/athletes/:id` with season points, team rank, upcoming races and their results history. Names across the app link to these pages. |
| Admin area | **Admin → Races** (search, quick status/priority/team-entry changes, edit, duplicate, delete) · **Results** (pick a race, enter every rider's overall position and time, save all at once; full recap with photos) · **Sponsors** (logo, website, tier, order) · **Athletes** (participation per season, CSV) |
| Notification bell | Derived in-app from data (`useNotifications`): closing deadlines, races this week, recaps to add |
| Native feel | Bottom tab bar with safe areas, 44 px targets, no overscroll/tap highlight/control selection, pull-to-refresh on Home and My Races |

### Mobile load performance (v2 item 1, addressed in this build)
- Routes are code-split: the first load only ships Home and Login.
- Startup data is two shared, cached queries (races and registrations) instead of per-screen calls.
- Photos are compressed on the phone before upload (max 1600 px), lazy-loaded, and signed in a single batch.
- The hero image is optional and should be kept small (see above). This was the most likely cause of the slow phone loads in Base44.

### Still open (v2)
- Push notifications (Capacitor Push + FCM/APNs).
- Re-syncing admin edits to the Google Sheet (add `after update` triggers calling the same functions).
- Separate age-group ranking.
