import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { PageTitle } from './ui';

export const Stars = ({ n }: { n: number }) => <span aria-label={`${n} sur 5`} className="text-amber-400">{'★'.repeat(n)}<span className="text-zinc-600">{'★'.repeat(5 - n)}</span></span>;

/** Modération : masquer un avis inapproprié (il disparaît du site et de la note moyenne). */
export function Reviews() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<'' | 'published' | 'hidden'>('');
  const q = useQuery({ queryKey: ['bo-reviews', status], queryFn: () => unwrap(api.admin.reviews.$get({ query: status ? { status } : {} })) });
  const set = useMutation({
    mutationFn: (v: { id: string; status: 'published' | 'hidden' }) => unwrap(api.admin.reviews[':id'].status.$post({ param: { id: v.id }, json: { status: v.status } })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bo-reviews'] }); qc.invalidateQueries({ queryKey: ['bo-kpis'] }); },
  });
  return (
    <div>
      <PageTitle title="Avis clients" sub="Les clients notent une commande une fois livrée. Masquez les avis inappropriés.">
        <select aria-label="Filtrer" className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value as '')}>
          <option value="">Tous</option><option value="published">Publiés</option><option value="hidden">Masqués</option>
        </select>
      </PageTitle>
      <Err e={q.error ?? set.error} />
      {q.isLoading && <p className="text-zinc-400">Chargement…</p>}
      {q.data && !q.data.reviews.length && <p className="text-zinc-400">Aucun avis pour le moment.</p>}
      <ul className="space-y-3">
        {q.data?.reviews.map((r) => (
          <li key={r.id} className={`card flex flex-wrap items-start justify-between gap-3 ${r.status === 'hidden' ? 'opacity-60' : ''}`}>
            <div className="min-w-0 flex-1">
              <p><Stars n={r.rating} /> <span className="ml-2 text-sm font-medium">{r.offerTitle}</span></p>
              <p className="text-xs text-zinc-500">{r.companyName} · {r.customerName} · {dateFr(r.createdAt)}{r.status === 'hidden' ? ' · masqué' : ''}</p>
              {r.comment && <p className="mt-2 text-sm text-zinc-200">« {r.comment} »</p>}
            </div>
            <button className="btn-ghost" disabled={set.isPending} onClick={() => set.mutate({ id: r.id, status: r.status === 'hidden' ? 'published' : 'hidden' })}>{r.status === 'hidden' ? 'Republier' : 'Masquer'}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
