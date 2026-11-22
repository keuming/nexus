import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { OfferCard } from './Home';
import { useT } from '../lib/i18n';

/** Offres mises de côté par le client. */
export function Favorites() {
  const t = useT();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ['favorites'], queryFn: () => unwrap(api.favorites.$get()) });
  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <h1 className="text-center text-2xl font-bold">{t('Mes favoris')}</h1>
      <Err e={q.error} />
      {q.isLoading ? <p className="text-center text-zinc-400">{t('Chargement…')}</p> : !q.data?.offers.length ? (
        <div className="card mx-auto max-w-md space-y-3 text-center"><p className="text-zinc-300">{t("Aucun favori pour le moment. Touchez le ♡ d'une offre pour la retrouver ici.")}</p><Link className="btn" to="/">{t('Voir le catalogue')}</Link></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {q.data.offers.map((o) => <OfferCard key={o.id} o={o} onBook={() => nav(`/reserver/${o.id}`)} />)}
        </div>
      )}
    </div>
  );
}
