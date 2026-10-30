import { createClient } from 'npm:@supabase/supabase-js@2';

export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

/** Calls come from the database (pg_net) with a shared secret header. */
export function authorised(req: Request) {
  const secret = Deno.env.get('WEBHOOK_SECRET');
  return !!secret && req.headers.get('x-webhook-secret') === secret;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Run independent steps so one failure (e.g. Sheets down) doesn't block the others. */
export async function runSteps(steps: Record<string, () => Promise<unknown>>) {
  const names = Object.keys(steps);
  const results = await Promise.allSettled(names.map((n) => steps[n]()));
  return Object.fromEntries(
    results.map((r, i) => {
      if (r.status === 'rejected') console.error(`${names[i]} failed:`, r.reason);
      return [names[i], r.status === 'fulfilled' ? 'ok' : String(r.reason)];
    }),
  );
}
