// Minimal Google API client for Edge Functions using a service account (no SDK needed).
// GOOGLE_SERVICE_ACCOUNT = the full JSON key of a service account that has been given
// edit access to the team Sheet and the Drive folder.

type ServiceAccount = { client_email: string; private_key: string };

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

async function importKey(pem: string) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

const tokenCache = new Map<string, { token: string; exp: number }>();

export async function googleToken(scopes: string[]): Promise<string> {
  const key = scopes.join(' ');
  const cached = tokenCache.get(key);
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;

  const sa: ServiceAccount = JSON.parse(Deno.env.get('GOOGLE_SERVICE_ACCOUNT') ?? '{}');
  if (!sa.client_email) throw new Error('GOOGLE_SERVICE_ACCOUNT is not set');
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: sa.client_email, scope: key, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', await importKey(sa.private_key), new TextEncoder().encode(`${header}.${claim}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google token error: ${await res.text()}`);
  const json = await res.json();
  tokenCache.set(key, { token: json.access_token, exp: Date.now() + json.expires_in * 1000 });
  return json.access_token;
}

export async function appendSheetRow(tab: string, values: (string | number | null)[]) {
  const sheetId = Deno.env.get('GOOGLE_SHEET_ID');
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID is not set');
  const token = await googleToken(['https://www.googleapis.com/auth/spreadsheets']);
  const range = encodeURIComponent(`${tab}!A1`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values: [values.map((v) => v ?? '')] }) },
  );
  if (!res.ok) throw new Error(`Sheets append failed: ${await res.text()}`);
}

export async function uploadToDrive(name: string, mimeType: string, bytes: Uint8Array): Promise<string> {
  const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
  if (!folderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID is not set');
  const token = await googleToken(['https://www.googleapis.com/auth/drive']);
  const boundary = `wrt${crypto.randomUUID()}`;
  const meta = JSON.stringify({ name, parents: [folderId] });
  const head = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const tail = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${await res.text()}`);
  return (await res.json()).webViewLink as string;
}
