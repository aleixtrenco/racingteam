// New race recap → append to Google Sheet ("Recaps" tab) + copy photos to the shared Drive folder.
import { appendSheetRow, uploadToDrive } from '../_shared/google.ts';
import { admin, authorised, json, runSteps } from '../_shared/util.ts';

Deno.serve(async (req) => {
  if (!authorised(req)) return json({ error: 'unauthorised' }, 401);
  const { record: r } = await req.json();
  const supabase = admin();
  const photos: string[] = r.photos ?? [];

  const driveLinks: string[] = [];
  const outcome = await runSteps({
    drive: async () => {
      for (const [i, path] of photos.entries()) {
        const { data, error } = await supabase.storage.from('recap-photos').download(path);
        if (error) throw error;
        const ext = path.split('.').pop() ?? 'jpg';
        const name = `${r.race_date} ${r.race_name} - ${r.athlete_name} - ${i + 1}.${ext}`;
        driveLinks.push(await uploadToDrive(name, data.type || 'image/jpeg', new Uint8Array(await data.arrayBuffer())));
      }
    },
  });
  // The sheet row includes the Drive links, so it is written after the uploads.
  const sheet = await runSteps({
    sheet: () =>
      appendSheetRow('Recaps', [r.created_at, r.race_name, r.race_date, r.athlete_name, r.overall_position, r.result_text ?? '', r.notes ?? '', driveLinks.join('\n')]),
  });
  return json({ ...outcome, ...sheet });
});
