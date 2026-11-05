import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { CountrySelect } from '../components/ChipInput';
import { ACTIVITIES } from '../../shared/constants';
import { COUNTRIES, citiesOf, countryName } from '../../shared/geo';

export const ACTIVITY_LABEL: Record<string, string> = {
  transport: 'Transport', restauration: 'Restauration', expedition: 'Expédition', hotel: 'Hôtel', boutique: 'Boutique',
  agence_voyage: 'Agence de voyage', residence_meuble: 'Résidence meublée', loisirs: 'Loisirs', location_vente: 'Location / vente',
  smartphones: 'Smartphones', laptops: 'Laptops', tablets: 'Tablettes',
};

export function Home() {
  const [activity, setActivity] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();
  const cities = country ? citiesOf(country) : COUNTRIES.flatMap((c) => c.cities);

  const acts = useQuery({ queryKey: ['activities'], queryFn: () => unwrap(api.offers.activities.$get()) });
  const visibleActs = acts.data?.activities ?? ACTIVITIES;

  const list = useQuery({
    queryKey: ['offers', activity, country, city, q],
    queryFn: () => unwrap(api.offers.$get({ query: {
      ...(activity ? { activity: activity as (typeof ACTIVITIES)[number] } : {}),
      ...(country ? { country } : {}),
      ...(city.trim() ? { city: city.trim() } : {}),
      ...(q.trim() ? { q: q.trim() } : {}),
    } })),
  });

  return (
    <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[13rem_1fr]">
        <aside className="card self-start md:sticky md:top-[4.5rem] md:max-h-[calc(100dvh-6rem)] md:overflow-y-auto" aria-label="Types d'activité">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Activités</p>
          <div className="flex gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
            {['', ...visibleActs].map((a) => (
              <button key={a} onClick={() => setActivity(a)} className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${activity === a ? 'bg-brand font-semibold text-black' : 'text-zinc-300 hover:bg-white/5'}`}>
                {a ? ACTIVITY_LABEL[a] : 'Toutes'}
              </button>
            ))}
          </div>
        </aside>
      <div className="min-w-0 space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Réservez en Afrique, <span className="text-brand">simplement.</span></h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">Transport, hôtels, restaurants et loisirs auprès d’entreprises validées par BackMarket.</p>

        <form className="card mt-8 grid gap-3 text-left sm:grid-cols-3" onSubmit={(e) => e.preventDefault()} role="search">
          <div className="space-y-1">
            <label htmlFor="f-country" className="text-xs text-zinc-400">Pays de destination</label>
            <CountrySelect id="f-country" allowAll value={country} onChange={(v) => { setCountry(v); setCity(''); }} />
          </div>
          <div className="space-y-1">
            <label htmlFor="f-city" className="text-xs text-zinc-400">Ville ou arrêt</label>
            {country ? (
              <select id="f-city" className="input" value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">Toutes les villes</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <input id="f-city" className="input" list="f-cities" placeholder="Ex. Bouaké, gare nord…" value={city} onChange={(e) => setCity(e.target.value)} />
            )}
            <datalist id="f-cities">{cities.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="space-y-1">
            <label htmlFor="f-q" className="text-xs text-zinc-400">Rechercher</label>
            <input id="f-q" className="input" placeholder="Mot-clé…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </form>

        {!user && <p className="mt-4 text-sm text-zinc-400">Vous êtes une entreprise ? <Link to="/souscription" className="text-brand">Devenez partenaire BackMarket</Link></p>}

      </section>

      <Err e={list.error} />
      {list.isLoading ? <p className="text-center text-zinc-400">Chargement…</p> : !list.data?.offers.length ? (
        <p className="text-center text-zinc-400">Aucune offre ne correspond à votre recherche.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.data.offers.map((o) => (
            <OfferCard key={o.id} o={o} onBook={() => nav(user ? `/reserver/${o.id}` : '/login', user ? undefined : { state: { from: `/reserver/${o.id}` } })} />
          ))}
        </div>
      )}
    </div>
    </div>
  );
}

interface OfferItem { id: string; title: string; description: string; priceFcfa: number; startsAt: string; remaining: number; country: string; city: string; stops: string[]; photoCount: number; companyName: string; activity: string }

/** Carte d'offre compacte : photo, titre, lieu, prix. Les détails (description, arrêts) s'ouvrent à la demande. */
function OfferCard({ o, onBook }: { o: OfferItem; onBook: () => void }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!o.description || o.stops.length > 0;
  return (
    <article className="card flex flex-col gap-2 !p-0 overflow-hidden">
      {o.photoCount > 0 && <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />}
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-brand">{ACTIVITY_LABEL[o.activity] ?? o.activity}</span>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug">{o.title}</h2>
        <p className="truncate text-sm text-zinc-400">{o.companyName} · {o.city ? `${o.city}, ` : ''}{countryName(o.country)}</p>
        <p className="text-xs text-zinc-500">{dateFr(o.startsAt)} · {o.remaining} place(s)</p>
        {hasDetails && (
          <>
            <button type="button" className="mt-1 self-start text-sm text-brand hover:underline" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              {open ? 'Masquer les détails ▲' : 'Voir les détails ▼'}
            </button>
            {open && (
              <div className="space-y-1 rounded-lg bg-white/5 p-3 text-sm text-zinc-300">
                {o.description && <p className="whitespace-pre-line">{o.description}</p>}
                {o.stops.length > 0 && <p className="text-xs text-zinc-400">Arrêts : {o.stops.join(' · ')}</p>}
              </div>
            )}
          </>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-bold">{fcfa(o.priceFcfa)}</span>
          <button className="btn" disabled={o.remaining < 1} onClick={onBook}>{o.remaining < 1 ? 'Complet' : 'Réserver'}</button>
        </div>
      </div>
    </article>
  );
}
