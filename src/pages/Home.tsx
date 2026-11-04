import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { ACTIVITIES } from '../../shared/constants';

const LABEL: Record<string, string> = {
  transport: 'Transport', restauration: 'Restauration', expedition: 'Expédition', hotel: 'Hôtel', boutique: 'Boutique',
  agence_voyage: 'Agence de voyage', residence_meuble: 'Résidence meublée', loisirs: 'Loisirs', location_vente: 'Location / vente',
};

export function Home() {
  const [activity, setActivity] = useState<string>('');
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['offers', activity, q],
    queryFn: () => unwrap(api.offers.$get({ query: { ...(activity ? { activity: activity as (typeof ACTIVITIES)[number] } : {}), ...(q ? { q } : {}) } })),
  });
  const book = useMutation({
    mutationFn: (offerId: string) => unwrap(api.bookings.$post({ json: { offerId, seats: 1 } })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); nav('/account'); },
  });

  return (
    <div className="space-y-8">
      <section className="py-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Réservez en Afrique, <span className="text-brand">simplement.</span></h1>
        <p className="mt-3 max-w-xl text-zinc-400">Transport, hôtels, restaurants et loisirs auprès d’entreprises validées par NEXUS.</p>
        <input className="input mt-5 max-w-md" placeholder="Rechercher une offre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" />
        <div className="mt-4 flex flex-wrap gap-2">
          {['', ...ACTIVITIES].map((a) => (
            <button key={a} onClick={() => setActivity(a)} className={`rounded-full border px-3 py-1 text-sm ${activity === a ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>
              {a ? LABEL[a] : 'Tout'}
            </button>
          ))}
        </div>
      </section>
      <Err e={list.error ?? book.error} />
      {list.isLoading ? <p className="text-zinc-400">Chargement…</p> : !list.data?.offers.length ? <p className="text-zinc-400">Aucune offre disponible pour le moment.</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.offers.map((o) => (
            <article key={o.id} className="card flex flex-col">
              <span className="text-xs uppercase tracking-wide text-brand">{LABEL[o.activity] ?? o.activity} · {o.city}</span>
              <h2 className="mt-1 text-lg font-semibold">{o.title}</h2>
              <p className="text-sm text-zinc-400">{o.companyName}</p>
              {o.description && <p className="mt-2 line-clamp-3 text-sm text-zinc-300">{o.description}</p>}
              <p className="mt-3 text-sm text-zinc-400">{dateFr(o.startsAt)} · {o.remaining} place(s)</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-lg font-bold">{fcfa(o.priceFcfa)}</span>
                <button className="btn" disabled={book.isPending || o.remaining < 1}
                  onClick={() => (user ? book.mutate(o.id) : nav('/login'))}>
                  {o.remaining < 1 ? 'Complet' : 'Réserver'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
