// Weekly (Monday) job: ask athletes who raced in the last few days for their recap.
// Each registration is reminded once (recap_sent flag).
import { brandedEmail, formatDate, sendEmail } from '../_shared/email.ts';
import { admin, authorised, json } from '../_shared/util.ts';

const LOOKBACK_DAYS = 4; // covers Thu–Sun race weekends when run on Monday

Deno.serve(async (req) => {
  if (!authorised(req)) return json({ error: 'unauthorised' }, 401);
  const supabase = admin();
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Dubai' }));
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const from = new Date(today); from.setDate(from.getDate() - LOOKBACK_DAYS);
  const to = new Date(today); to.setDate(to.getDate() - 1);

  const { data: regs, error } = await supabase
    .from('registrations')
    .select('id, race_id, race_name, race_date, user_id, athlete_name, athlete_email, races!inner(status)')
    .eq('recap_sent', false)
    .gte('race_date', iso(from))
    .lte('race_date', iso(to))
    .neq('races.status', 'Cancelled');
  if (error) return json({ error: error.message }, 500);

  const { data: results } = await supabase
    .from('race_results')
    .select('race_id, user_id')
    .in('race_id', [...new Set((regs ?? []).map((r) => r.race_id))]);
  const done = new Set((results ?? []).map((r) => `${r.race_id}:${r.user_id}`));

  let sent = 0;
  for (const r of regs ?? []) {
    if (done.has(`${r.race_id}:${r.user_id}`) || !r.athlete_email) continue;
    try {
      await sendEmail(
        r.athlete_email,
        `How did ${r.race_name} go?`,
        brandedEmail({
          heading: `How did it go, ${r.athlete_name?.split(' ')[0] || 'rider'}?`,
          intro: 'Share your result and a few photos so the team can celebrate and we can keep the season ranking up to date.',
          rows: [['Race', r.race_name], ['Date', formatDate(r.race_date)]],
          ctaLabel: 'Add your recap',
          ctaPath: `/results?add=${r.race_id}`,
        }),
      );
      await supabase.from('registrations').update({ recap_sent: true }).eq('id', r.id);
      sent++;
    } catch (e) {
      console.error(`Reminder to ${r.athlete_email} failed:`, e);
    }
  }
  return json({ checked: regs?.length ?? 0, sent });
});
