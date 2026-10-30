// Branded transactional email via Resend (https://resend.com).
// RESEND_API_KEY, EMAIL_FROM (e.g. "Wolfi's Racing Team <racing@wolfis.ae>"), APP_URL.

export async function sendEmail(to: string, subject: string, html: string) {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM') ?? "Wolfi's Racing Team <onboarding@resend.dev>", to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Email failed: ${await res.text()}`);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Black/yellow/white email shell matching the app. */
export function brandedEmail(opts: { heading: string; intro: string; rows?: [string, string][]; ctaLabel?: string; ctaPath?: string }) {
  const appUrl = Deno.env.get('APP_URL') ?? '';
  const rows = (opts.rows ?? [])
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:110px">${esc(k)}</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#0a0a0a">${esc(v)}</td></tr>`)
    .join('');
  const cta = opts.ctaLabel && appUrl
    ? `<a href="${appUrl}${opts.ctaPath ?? ''}" style="display:inline-block;margin-top:24px;background:#0a0a0a;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px">${esc(opts.ctaLabel)}</a>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Gilroy,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#0a0a0a;padding:20px 28px;border-bottom:4px solid #fed925">
  <span style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.04em">WOLFI'S <span style="color:#fed925">RACING TEAM</span></span>
</td></tr>
<tr><td style="padding:28px">
  <h1 style="margin:0 0 12px;font-size:22px;color:#0a0a0a">${esc(opts.heading)}</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#374151">${esc(opts.intro)}</p>
  <table role="presentation" cellpadding="0" cellspacing="0">${rows}</table>
  ${cta}
</td></tr>
<tr><td style="padding:16px 28px;background:#fafafa;color:#9ca3af;font-size:12px">Wolfi's Racing Team · Dubai</td></tr>
</table></td></tr></table></body></html>`;
}
