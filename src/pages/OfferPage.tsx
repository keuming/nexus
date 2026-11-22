import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, fcfa, unwrap } from '../lib/api';
import { placeLabel } from '../lib/place';
import { Err } from '../components/Layout';
import { ShareButton, absUrl } from '../components/ShareButton';
import { SITE } from '../../shared/site';
import { FavButton, RatingStars } from '../components/engage';
import { useT } from '../lib/i18n';
import { dateFr } from '../lib/api';

/** Page publique d'une offre : c'est le lien partagé sur WhatsApp, Facebook, etc. */
export function OfferPage() {
  const t = useT();
  const { id = '' } = useParams();
  const nav = useNavigate();
  const q = useQuery({ queryKey: ['offer', id], queryFn: () => unwrap(api.offers[':id'].$get({ param: { id } })), retry: false });
  const rv = useQuery({ queryKey: ['offer-reviews', id], queryFn: () => unwrap(api.offers[':id'].reviews.$get({ param: { id } })) });
  if (q.isLoading) return <p className="text-center text-zinc-400">{t('Chargement…')}</p>;
  const o = q.data?.offer;
  if (q.error || !o) return <div className="mx-auto max-w-md space-y-3 text-center"><Err e={q.error ?? new Error(t('Offre introuvable ou indisponible'))} /><Link className="btn" to="/">{t('Voir le catalogue')}</Link></div>;
  const price = o.priceFcfa > 0 ? fcfa(o.priceFcfa) : t('Gratuit');
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/" className="text-sm text-zinc-400 hover:text-white">{t('← Retour au catalogue')}</Link>
      <article className="card space-y-4 overflow-hidden !p-0">
        {o.photoCount > 0 && <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} className="aspect-[16/9] w-full object-cover" />}
        <div className="space-y-3 px-5 pb-5 pt-1">
          <h1 className="text-2xl font-bold leading-snug">{o.title}</h1>
          <p className="text-sm text-zinc-300">{o.companyName} · {placeLabel(o)}</p>
          <RatingStars avg={o.ratingAvg} count={o.ratingCount} />
          {o.description && <p className="whitespace-pre-line text-sm text-zinc-300">{o.description}</p>}
          {o.stops.length > 0 && <p className="text-xs text-zinc-400">{t('Arrêts :')} {o.stops.join(' · ')}</p>}
          <p className="text-xs text-zinc-500">{o.remaining < 1 ? t('Complet') : t('{n} disponibles', { n: o.remaining })}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <span className="text-xl font-bold">{price}</span>
            <div className="flex gap-2">
              <FavButton offerId={o.id} className="!bg-white/10" />
              <ShareButton url={absUrl(`/offre/${o.id}`)} title={`${o.title} · ${price}`} text={`${o.companyName} sur ${SITE.name}`} />
              <button className="btn" disabled={o.remaining < 1} onClick={() => nav(`/reserver/${o.id}`)}>{o.remaining < 1 ? t('Complet') : t('Réserver')}</button>
            </div>
          </div>
        </div>
      </article>
      {!!rv.data?.reviews.length && (
        <section aria-label="Avis clients" className="card space-y-3">
          <h2 className="font-semibold">{t('Avis des clients')}</h2>
          <ul className="space-y-3">
            {rv.data.reviews.map((r) => (
              <li key={r.id} className="border-t border-white/10 pt-3 first:border-0 first:pt-0">
                <p className="text-sm"><span className="text-amber-400" aria-label={`${r.rating} sur 5`}>{'★'.repeat(r.rating)}<span className="text-zinc-600">{'★'.repeat(5 - r.rating)}</span></span> <span className="ml-1 font-medium">{r.name}</span> <span className="text-xs text-zinc-500">· {dateFr(r.createdAt)}</span></p>
                {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
