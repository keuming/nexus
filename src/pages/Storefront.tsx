import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { ShareButton, absUrl } from '../components/ShareButton';
import { countryName } from '../../shared/geo';
import { OfferCard, ACTIVITY_LABEL } from './Home';

/** Vitrine d'un marchand : uniquement ses articles. C'est la page que le partenaire partage (et non l'ensemble de BackMarket). */
export function Storefront() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ['storefront', id], queryFn: () => unwrap(api.offers.companies[':id'].$get({ param: { id } })), retry: false });
  if (q.isLoading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (q.error || !q.data) return <div className="mx-auto max-w-md space-y-3 text-center"><Err e={q.error ?? new Error('Boutique introuvable')} /><Link className="btn" to="/">Voir le catalogue BackMarket</Link></div>;
  const { company: c, offers } = q.data;
  const url = absUrl(`/boutique/${c.id}`);
  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center gap-3 text-center">
        {c.logoUrl && <img src={c.logoUrl} alt={`Logo ${c.name}`} className="h-20 w-20 rounded-2xl bg-white object-cover" />}
        <h1 className="text-3xl font-extrabold tracking-tight">{c.name}</h1>
        <p className="text-sm text-zinc-400">{ACTIVITY_LABEL[c.activity] ?? c.activity} · {c.city}, {countryName(c.country)}</p>
        <ShareButton className="btn" label={user?.role === 'owner' ? 'Partager ma boutique' : 'Partager cette boutique'} url={url} title={`${c.name} : commandez et réservez en ligne`} text={`Tous les articles de ${c.name} sur BackMarket`} />
      </section>
      {!offers.length ? <p className="card text-center text-sm text-zinc-400">Aucun article disponible pour le moment.</p> : (
        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((o) => <OfferCard key={o.id} o={o} onBook={() => nav(`/reserver/${o.id}`)} />)}
        </div>
      )}
    </div>
  );
}
