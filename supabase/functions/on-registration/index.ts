// New registration → append to Google Sheet ("Registrations" tab) + confirmation email.
import { appendSheetRow } from '../_shared/google.ts';
import { brandedEmail, formatDate, sendEmail } from '../_shared/email.ts';
import { authorised, json, runSteps } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (!authorised(req)) return json({ error: 'unauthorised' }, 401);
  const { record: r } = await req.json();

  const outcome = await runSteps({
    sheet: () =>
      appendSheetRow('Registrations', [r.created_at, r.race_name, r.race_date, r.athlete_name, r.athlete_email, r.note ?? '']),
    email: () =>
      r.athlete_email
        ? sendEmail(
            r.athlete_email,
            `You're in: ${r.race_name}`,
            brandedEmail({
              heading: `You're registered, ${r.athlete_name?.split(' ')[0] || 'rider'}!`,
              intro: "Thanks for signing up. We've added you to the team list for this race.",
              rows: [['Race', r.race_name], ['Date', formatDate(r.race_date)], ...(r.note ? [['Note', r.note] as [string, string]] : [])],
              ctaLabel: 'View race',
              ctaPath: `/races/${r.race_id}`,
            }),
          )
        : Promise.resolve(),
  });
  return json(outcome);
});
