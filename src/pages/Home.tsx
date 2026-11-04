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
};

export function Home() {
  const [activity, setActivity] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();
  const cities = country ? citiesOf(country) : COUNTRIES.flatMap((c) => c.cities);

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
    <div className="space-y-10">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Réservez en Afrique, <span className="text-brand">simplement.</span></h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">Transport, hôtels, restaurants et loisirs auprès d’entreprises validées par NEXUS.</p>

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

        {!user && <p className="mt-4 text-sm text-zinc-400">Vous êtes une entreprise ? <Link to="/souscription" className="text-brand">Devenez partenaire NEXUS</Link></p>}

      </section>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[13rem_1fr]">
        <aside className="card h-fit lg:sticky lg:top-20" aria-label="Types d'activité">
          <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Activités</p>
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {['', ...ACTIVITIES].map((a) => (
              <button key={a} onClick={() => setActivity(a)} className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm ${activity === a ? 'bg-brand font-semibold text-black' : 'text-zinc-300 hover:bg-white/5'}`}>
                {a ? ACTIVITY_LABEL[a] : 'Toutes'}
              </button>
            ))}
          </div>
        </aside>
        <div>
      <Err e={list.error} />
      {list.isLoading ? <p className="text-center text-zinc-400">Chargement…</p> : !list.data?.offers.length ? (
        <p className="text-center text-zinc-400">Aucune offre ne correspond à votre recherche.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.data.offers.map((o) => (
            <article key={o.id} className="card flex flex-col">
              {o.photoCount > 0 && <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} loading="lazy" className="-mx-4 -mt-4 mb-3 aspect-[16/10] w-[calc(100%+2rem)] max-w-none rounded-t-[inherit] object-cover" />}
              <span className="text-xs uppercase tracking-wide text-brand">{ACTIVITY_LABEL[o.activity] ?? o.activity}</span>
              <h2 className="mt-1 text-lg font-semibold">{o.title}</h2>
              <p className="text-sm text-zinc-400">{o.companyName}</p>
              <p className="mt-2 text-sm text-zinc-300">{o.city ? `${o.city} → ` : ''}{countryName(o.country)}</p>
              {o.stops.length > 0 && (
                <p className="mt-1 text-xs text-zinc-500">Arrêts : {o.stops.slice(0, 3).join(' · ')}{o.stops.length > 3 ? ` +${o.stops.length - 3}` : ''}</p>
              )}
              {o.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{o.description}</p>}
              <p className="mt-3 text-sm text-zinc-400">{dateFr(o.startsAt)} · {o.remaining} place(s)</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-lg font-bold">{fcfa(o.priceFcfa)}</span>
                <button className="btn" disabled={o.remaining < 1} onClick={() => nav(user ? `/reserver/${o.id}` : '/login', user ? undefined : { state: { from: `/reserver/${o.id}` } })}>
                  {o.remaining < 1 ? 'Complet' : 'Réserver'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
