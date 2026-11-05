import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CountrySelect } from '../components/ChipInput';
import { ACTIVITIES, DATED_ACTIVITIES } from '../../shared/constants';
import { COUNTRIES, citiesOf } from '../../shared/geo';
import { placeLabel } from '../lib/place';

export const ACTIVITY_LABEL: Record<string, string> = {
  transport: 'Transport', restauration: 'Restauration', expedition: 'Expédition', hotel: 'Hôtel', boutique: 'Boutique',
  agence_voyage: 'Agence de voyage', residence_meuble: 'Résidence meublée', loisirs: 'Loisirs', location_vente: 'Location / vente',
  smartphones: 'Smartphones', laptops: 'Laptops', tablets: 'Tablettes',
  mode: 'Mode', beaute: 'Beauté',
};

/** Entrées du menu : une activité, ou un groupe d'activités proches (filtrées ensemble). */
const MENU: { id: string; label: string; members: string[] }[] = [
  ...ACTIVITIES.filter((a) => !['smartphones', 'laptops', 'tablets', 'mode', 'beaute'].includes(a)).map((a) => ({ id: a, label: ACTIVITY_LABEL[a], members: [a as string] })),
  { id: 'smartphones', label: 'Smartphones', members: ['smartphones'] },
  { id: 'laptops_tablets', label: 'Laptops / Tablettes', members: ['laptops', 'tablets'] },
  { id: 'mode_beaute', label: 'Mode / Beauté', members: ['mode', 'beaute'] },
];

/** Valeur qui ne change qu'après une pause de saisie (évite une requête à chaque frappe). */
function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export function Home() {
  const [params, setParams] = useSearchParams();
  const activity = params.get('activite') ?? '';
  const country = params.get('pays') ?? '';
  const [city, setCity] = useState(params.get('ville') ?? '');
  const [q, setQ] = useState(params.get('q') ?? '');
  const destCountry = params.get('pays_arr') ?? '';
  const [destCityIn, setDestCityIn] = useState(params.get('ville_arr') ?? '');
  const isTransport = activity === 'transport';
  const debCity = useDebounced(city.trim());
  const debQ = useDebounced(q.trim());
  const debDest = useDebounced(destCityIn.trim());
  const dDest = params.get('ville_arr') ?? '';
  const dCity = params.get('ville') ?? '';
  const dQ = params.get('q') ?? '';
  const { user } = useAuth();
  const nav = useNavigate();
  const cities = country ? citiesOf(country) : COUNTRIES.flatMap((c) => c.cities);

  // L'adresse est la source de vérité : le bouton « retour » et le partage de lien fonctionnent.
  // La saisie libre n'y est écrite qu'après une pause (pas de requête à chaque frappe).
  useEffect(() => { setParams((p) => { if ((p.get('ville') ?? '') === debCity) return p; const n = new URLSearchParams(p); if (debCity) n.set('ville', debCity); else n.delete('ville'); return n; }, { replace: true }); }, [debCity]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setParams((p) => { if ((p.get('ville_arr') ?? '') === debDest) return p; const n = new URLSearchParams(p); if (debDest) n.set('ville_arr', debDest); else n.delete('ville_arr'); return n; }, { replace: true }); }, [debDest]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setParams((p) => { if ((p.get('q') ?? '') === debQ) return p; const n = new URLSearchParams(p); if (debQ) n.set('q', debQ); else n.delete('q'); return n; }, { replace: true }); }, [debQ]); // eslint-disable-line react-hooks/exhaustive-deps
  const setFilter = (k: string, v: string) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (v) n.set(k, v); else n.delete(k);
    if (k === 'pays') { n.delete('ville'); setCity(''); }
    if (k === 'pays_arr') { n.delete('ville_arr'); setDestCityIn(''); }
    if (k === 'activite' && v !== 'transport') { n.delete('pays_arr'); n.delete('ville_arr'); setDestCityIn(''); }
    return n;
  }, { replace: true });

  const acts = useQuery({ queryKey: ['activities'], queryFn: () => unwrap(api.offers.activities.$get()), staleTime: 60_000 });
  const menu = acts.data ? MENU.filter((m) => m.members.some((x) => acts.data.activities.includes(x as (typeof ACTIVITIES)[number]))) : MENU;
  // Un type masqué entre-temps par l'administration ne doit pas rester sélectionné.
  useEffect(() => { if (acts.data && activity && !menu.some((m) => m.id === activity)) setFilter('activite', ''); }); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useQuery({
    queryKey: ['offers', activity, country, dCity, destCountry, dDest, dQ],
    placeholderData: keepPreviousData,
    queryFn: () => unwrap(api.offers.$get({ query: {
      ...(activity ? { activity: (MENU.find((m) => m.id === activity)?.members ?? [activity]).join(',') } : {}),
      ...(country ? { country } : {}),
      ...(dCity ? { city: dCity } : {}),
      ...(destCountry ? { destCountry } : {}),
      ...(dDest ? { destCity: dDest } : {}),
      ...(dQ ? { q: dQ } : {}),
    } })),
  });
  const filtered = !!(activity || country || city.trim() || q.trim() || destCountry || destCityIn.trim());
  const reset = () => { setCity(''); setQ(''); setDestCityIn(''); setParams(new URLSearchParams(), { replace: true }); };
  const offers = list.data?.offers ?? [];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[13rem_1fr]">
      <aside className="card self-start md:sticky md:top-[4.5rem]" aria-label="Types d'activité">
        <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Activités</p>
        <div className="flex flex-wrap gap-2 md:flex-col md:flex-nowrap md:gap-1">
          {[{ id: '', label: 'Toutes' }, ...menu].map((m) => (
            <button key={m.id} aria-pressed={activity === m.id} onClick={() => setFilter('activite', m.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition ${activity === m.id ? 'bg-brand font-semibold text-black' : 'text-zinc-300 hover:bg-white/5'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <section className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Réservez en Afrique, <span className="text-brand">simplement.</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">Transport, hôtels, restaurants, loisirs, high-tech, mode et beauté auprès d’entreprises validées par BackMarket.</p>

          <form className={`card mt-5 grid gap-3 text-left ${isTransport ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3'}`} onSubmit={(e) => e.preventDefault()} role="search">
            <PlaceFields id="f-dep" countryLabel={isTransport ? 'Pays de départ' : 'Pays'} cityLabel={isTransport ? 'Ville de départ' : 'Ville ou arrêt'}
              country={country} city={city} onCountry={(v) => setFilter('pays', v)} onCity={setCity} cities={cities} />
            {isTransport && (
              <PlaceFields id="f-arr" countryLabel="Pays d'arrivée" cityLabel="Ville d'arrivée"
                country={destCountry} city={destCityIn} onCountry={(v) => setFilter('pays_arr', v)} onCity={setDestCityIn} cities={destCountry ? citiesOf(destCountry) : COUNTRIES.flatMap((c) => c.cities)} />
            )}
            <div className={`space-y-1 ${isTransport ? 'sm:col-span-2 xl:col-span-4' : ''}`}>
              <label htmlFor="f-q" className="text-xs text-zinc-400">Rechercher</label>
              <input id="f-q" className="input" type="search" placeholder="Mot-clé…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </form>
          {!user && <p className="mt-3 text-sm text-zinc-400">Vous êtes une entreprise ? <Link to="/souscription" className="text-brand">Devenez partenaire BackMarket</Link></p>}
        </section>

        <div className="flex min-h-8 items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm text-zinc-400">{list.isLoading ? 'Chargement des offres…' : `${offers.length} offre${offers.length > 1 ? 's' : ''}${filtered ? ' correspondante' + (offers.length > 1 ? 's' : '') : ''}`}</p>
          {filtered && <button className="btn-ghost" onClick={reset}>Réinitialiser les filtres</button>}
        </div>

        {list.isLoading ? (
          <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-60 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
          </div>
        ) : list.error && !list.data ? (
          <div role="alert" className="card mx-auto max-w-md space-y-3 text-center">
            <p className="text-zinc-300">Impossible de charger les offres pour le moment.</p>
            <button className="btn" onClick={() => list.refetch()}>Réessayer</button>
          </div>
        ) : !offers.length ? (
          <div className="card mx-auto max-w-md space-y-3 text-center">
            <p className="text-zinc-300">{filtered ? 'Aucune offre ne correspond à votre recherche.' : 'Aucune offre disponible pour le moment.'}</p>
            {filtered && <button className="btn" onClick={reset}>Voir toutes les offres</button>}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 transition-opacity min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${list.isFetching ? 'opacity-60' : ''}`}>
            {offers.map((o) => <OfferCard key={o.id} o={o} onBook={() => nav(`/reserver/${o.id}`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

interface OfferItem { destCity?: string | null; destCountry?: string | null; id: string; title: string; description: string; priceFcfa: number; startsAt: string; remaining: number; country: string; city: string; stops: string[]; photoCount: number; companyName: string; activity: string }

/** Carte d'offre compacte : photo (ou visuel par défaut), titre, lieu, prix. Les détails s'ouvrent à la demande. */
function OfferCard({ o, onBook }: { o: OfferItem; onBook: () => void }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const dated = (DATED_ACTIVITIES as readonly string[]).includes(o.activity);
  const hasDetails = !!o.description || o.stops.length > 0;
  const low = o.remaining > 0 && o.remaining <= 3;
  return (
    <article className="card flex flex-col overflow-hidden !p-0 transition hover:border-white/25">
      {o.photoCount > 0 && !broken ? (
        <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} loading="lazy" onError={() => setBroken(true)} className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand/25 to-white/5 text-3xl font-extrabold text-brand/70" aria-hidden>{(ACTIVITY_LABEL[o.activity] ?? '?').charAt(0)}</div>
      )}
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-brand">{ACTIVITY_LABEL[o.activity] ?? o.activity}</span>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug">{o.title}</h2>
        {o.destCity && <p className="line-clamp-2 text-sm font-medium text-zinc-200">{placeLabel(o)}</p>}
        <p className="truncate text-sm text-zinc-400">{o.companyName}{o.destCity ? '' : ` · ${placeLabel(o)}`}</p>
        <p className="text-xs text-zinc-500">
          {dated && <>{dateFr(o.startsAt)} · </>}
          <span className={low ? 'font-medium text-amber-400' : ''}>{o.remaining < 1 ? 'Complet' : low ? `Plus que ${o.remaining} !` : dated ? `${o.remaining} places` : `${o.remaining} disponibles`}</span>
        </p>
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
          <span className="text-base font-bold">{o.priceFcfa > 0 ? fcfa(o.priceFcfa) : 'Gratuit'}</span>
          <button className="btn" disabled={o.remaining < 1} onClick={onBook}>{o.remaining < 1 ? 'Complet' : 'Réserver'}</button>
        </div>
      </div>
    </article>
  );
}

/** Pays + ville : liste déroulante des villes si un pays est choisi, sinon saisie libre avec suggestions. */
function PlaceFields({ id, countryLabel, cityLabel, country, city, onCountry, onCity, cities }: { id: string; countryLabel: string; cityLabel: string; country: string; city: string; onCountry: (v: string) => void; onCity: (v: string) => void; cities: string[] }) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor={`${id}-country`} className="text-xs text-zinc-400">{countryLabel}</label>
        <CountrySelect id={`${id}-country`} allowAll value={country} onChange={onCountry} />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${id}-city`} className="text-xs text-zinc-400">{cityLabel}</label>
        {country ? (
          <select id={`${id}-city`} className="input" value={city} onChange={(e) => onCity(e.target.value)}>
            <option value="">Toutes les villes</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <input id={`${id}-city`} className="input" list={`${id}-cities`} placeholder="Ex. Bouaké…" value={city} onChange={(e) => onCity(e.target.value)} />
        )}
        <datalist id={`${id}-cities`}>{cities.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
    </>
  );
}
