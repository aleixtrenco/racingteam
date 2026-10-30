import type React from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { logoSrc, uploadSponsorLogo, useDeleteSponsor, useSaveSponsor, useSponsors, type SponsorInput } from '@/hooks/useData';
import type { Sponsor } from '@/lib/types';
import { Button, ConfirmModal, ErrorNote, Input, Label, Modal, Select, Spinner, cx } from '@/components/ui';

export default function AdminSponsors() {
  const { data: sponsors = [], isLoading } = useSponsors();
  const save = useSaveSponsor();
  const del = useDeleteSponsor();
  const [editing, setEditing] = useState<Sponsor | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Sponsor | null>(null);

  // Swap display order with the neighbour in the same tier.
  const move = async (s: Sponsor, dir: -1 | 1) => {
    const tier = sponsors.filter((x) => x.tier === s.tier);
    const i = tier.findIndex((x) => x.id === s.id);
    const other = tier[i + dir];
    if (!other) return;
    await save.mutateAsync({ ...s, display_order: other.display_order });
    await save.mutateAsync({ ...other, display_order: s.display_order === other.display_order ? s.display_order + dir : s.display_order });
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-sm text-neutral-500">Logos link to each sponsor's website on the Home page. Main partners show larger.</p>
        <Button onClick={() => setAdding(true)} className="rounded-full">
          <Plus className="h-4 w-4" /> Add sponsor
        </Button>
      </div>
      <ErrorNote error={save.error || del.error} />

      {([1, 2] as const).map((tier) => {
        const list = sponsors.filter((s) => s.tier === tier);
        return (
          <section key={tier} className="space-y-2">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-500">{tier === 1 ? 'Main partners' : 'Partners'}</h2>
            {list.length === 0 && <p className="text-sm text-neutral-500">None yet.</p>}
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {list.map((s, i) => {
                const src = logoSrc(s.logo_url);
                return (
                  <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl bg-neutral-50 px-2 dark:bg-neutral-950">
                      {src ? <img src={src} alt="" className="max-h-10 w-auto max-w-full object-contain dark:brightness-0 dark:invert" /> : <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">No logo</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{s.name}</p>
                      {s.website ? (
                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 truncate text-xs text-neutral-500 hover:underline">
                          {s.website.replace(/^https?:\/\/(www\.)?/, '')} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">No website yet</p>
                      )}
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-0.5">
                      <SmallBtn label={`Move ${s.name} up`} onClick={() => move(s, -1)} disabled={i === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </SmallBtn>
                      <SmallBtn label={`Edit ${s.name}`} onClick={() => setEditing(s)}>
                        <Pencil className="h-4 w-4" />
                      </SmallBtn>
                      <SmallBtn label={`Move ${s.name} down`} onClick={() => move(s, 1)} disabled={i === list.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </SmallBtn>
                      <SmallBtn label={`Delete ${s.name}`} onClick={() => setDeleting(s)} danger>
                        <Trash2 className="h-4 w-4" />
                      </SmallBtn>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <SponsorForm open={adding || !!editing} sponsor={editing} nextOrder={Math.max(0, ...sponsors.map((s) => s.display_order)) + 1} onClose={() => (setAdding(false), setEditing(null))} />
      <ConfirmModal
        open={!!deleting}
        title="Remove sponsor?"
        message={`${deleting?.name} will no longer be shown in the app.`}
        confirmLabel="Remove"
        loading={del.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

const SmallBtn = ({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={cx('flex h-10 w-10 items-center justify-center rounded-full transition disabled:opacity-25', danger ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800')}
  >
    {children}
  </button>
);

function SponsorForm({ open, sponsor, nextOrder, onClose }: { open: boolean; sponsor: Sponsor | null; nextOrder: number; onClose: () => void }) {
  const save = useSaveSponsor();
  const [form, setForm] = useState<SponsorInput>({ name: '', logo_url: null, website: '', tier: 2, display_order: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!open) return;
    setForm(sponsor ? { ...sponsor } : { name: '', logo_url: null, website: '', tier: 2, display_order: nextOrder });
    setError(null);
    save.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sponsor]);

  const onLogo = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadSponsorLogo(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch (e) {
      setError(e);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let website = form.website?.trim() || null;
    if (website && !/^https?:\/\//.test(website)) website = `https://${website}`;
    await save.mutateAsync({ ...form, name: form.name.trim(), website });
    onClose();
  };

  const src = logoSrc(form.logo_url);
  return (
    <Modal open={open} onClose={onClose} title={sponsor ? `Edit ${sponsor.name}` : 'Add sponsor'}>
      <form onSubmit={submit} className="space-y-4">
        <Label label="Name">
          <Input id="sponsor-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Label>
        <Label label="Website" hint="Opens when someone taps the logo.">
          <Input id="sponsor-website" type="text" inputMode="url" placeholder="www.example.com" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </Label>
        <Label label="Placement">
          <Select id="sponsor-tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: Number(e.target.value) as 1 | 2 })}>
            <option value={1}>Main partner (large logo)</option>
            <option value={2}>Partner</option>
          </Select>
        </Label>
        <div className="space-y-1.5">
          <span className="text-sm font-bold">Logo</span>
          <div className="flex items-center gap-3">
            <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-950">
              {src ? <img src={src} alt="" className="max-h-12 w-auto max-w-full object-contain" /> : <span className="text-xs text-neutral-400">No logo</span>}
            </div>
            <label className="inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-xl border border-neutral-300 px-4 text-sm font-bold dark:border-neutral-700">
              <ImagePlus className="h-4 w-4" /> {uploading ? 'Uploading…' : src ? 'Replace' : 'Upload'}
              <input type="file" accept="image/png,image/webp,image/svg+xml,image/jpeg" className="sr-only" onChange={(e) => onLogo(e.target.files?.[0])} />
            </label>
          </div>
          <span className="block text-xs text-neutral-500">Best: PNG, WebP or SVG with a transparent background. It's shown in colour in light mode and white in dark mode.</span>
        </div>
        <ErrorNote error={error || save.error} />
        <div className="flex gap-2 pb-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={save.isPending} disabled={uploading}>
            {sponsor ? 'Save changes' : 'Add sponsor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
