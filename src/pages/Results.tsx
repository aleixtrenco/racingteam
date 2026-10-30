import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Pencil, Plus, Trash2, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeleteResult, useResults, useSignedUrls } from '@/hooks/useData';
import { formatDate } from '@/lib/dates';
import type { RaceResult } from '@/lib/types';
import { ResultFormModal } from '@/components/ResultFormModal';
import { Button, Card, EmptyState, ErrorNote, Modal, PageHeader, Spinner, cx } from '@/components/ui';

const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;

export default function Results() {
  const { profile, isAdmin } = useAuth();
  const { data: results = [], isLoading } = useResults();
  const del = useDeleteResult();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<RaceResult | null>(null);
  const [adding, setAdding] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const addFor = params.get('add') ?? undefined;

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; date: string | null; items: RaceResult[] }>();
    for (const r of results) {
      const key = r.race_id ?? `${r.race_name}-${r.race_date}`;
      const g = map.get(key) ?? { name: r.race_name, date: r.race_date, items: [] };
      g.items.push(r);
      map.set(key, g);
    }
    return [...map.entries()].sort(([, a], [, b]) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [results]);

  // Sign every visible photo in a single request.
  const allPhotos = useMemo(() => results.flatMap((r) => r.photos), [results]);
  const { data: urls = {} } = useSignedUrls(allPhotos);

  const closeForm = () => {
    setAdding(false);
    setEditing(null);
    if (addFor) setParams({}, { replace: true });
  };

  return (
    <div>
      <PageHeader
        title="Results & photos"
        subtitle="Race recaps from the team, newest first."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add Your Result
          </Button>
        }
      />
      <ErrorNote error={del.error} />

      {isLoading ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <EmptyState icon={<Camera className="h-8 w-8" />} title="No recaps yet">
          Be the first to share a result.
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, g]) => (
            <Card key={key} className="overflow-hidden">
              <div className="border-b border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="font-extrabold">{g.name}</h2>
                {g.date && <p className="text-xs text-neutral-500">{formatDate(g.date)}</p>}
              </div>
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {g.items.map((r) => {
                  const canEdit = isAdmin || r.user_id === profile?.id;
                  const podium = r.overall_position && r.overall_position <= 3;
                  return (
                    <li key={r.id} className="space-y-2 px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cx(
                            'flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-extrabold',
                            podium ? 'bg-brand-yellow text-brand-black' : 'bg-neutral-100 dark:bg-neutral-800',
                          )}
                          title="Overall position"
                        >
                          {r.overall_position ? ordinal(r.overall_position) : '—'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 font-bold">
                            {r.athlete_name}
                            {podium && <Trophy className="h-4 w-4 text-amber-500" />}
                          </p>
                          {r.result_text && <p className="text-sm">{r.result_text}</p>}
                          {r.notes && <p className="mt-1 whitespace-pre-line text-sm text-neutral-500">{r.notes}</p>}
                        </div>
                        {canEdit && (
                          <div className="flex shrink-0">
                            <button onClick={() => setEditing(r)} className="flex min-h-touch min-w-touch items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800" aria-label="Edit result">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirm(`Delete ${r.athlete_name}'s result for ${r.race_name}?`) && del.mutate(r)}
                              className="flex min-h-touch min-w-touch items-center justify-center rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              aria-label="Delete result"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {r.photos.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {r.photos.map((p) => (
                            <button key={p} onClick={() => urls[p] && setLightbox(urls[p])} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
                              {urls[p] && <img src={urls[p]} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <ResultFormModal open={adding || !!editing || !!addFor} onClose={closeForm} result={editing} defaultRaceId={addFor} />
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} title="Photo">
        {lightbox && <img src={lightbox} alt="" className="w-full rounded-xl" />}
      </Modal>
    </div>
  );
}
