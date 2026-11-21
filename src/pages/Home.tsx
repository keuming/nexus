import { Fragment, useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useMyCompany } from '../lib/company';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { CountrySelect } from '../components/ChipInput';
import { ACTIVITIES, type Activity } from '../../shared/constants';
import { CATEGORIES, SEARCH_FORMS, type SearchForm } from '../../shared/search';
import { COUNTRIES, citiesOf } from '../../shared/geo';
import { placeLabel } from '../lib/place';
import { ShareButton, absUrl } from '../components/ShareButton';
import { SITE } from '../../shared/site';
import { AdBanner, AdCard, FavButton, RatingStars, useAds } from '../components/engage';

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

/** Champ de formulaire synchronisé avec l'adresse : saisie locale immédiate, écriture dans l'URL après une pause. */
function useUrlInput(key: string): [string, (v: string) => void, string] {
  const [params, setParams] = useSearchParams();
  const committed = params.get(key) ?? '';
  const [local, setLocal] = useState(committed);
  const deb = useDebounced(local.trim());
  useEffect(() => {
    setParams((p) => { if ((p.get(key) ?? '') === deb) return p; const n = new URLSearchParams(p); if (deb) n.set(key, deb); else n.delete(key); return n; }, { replace: true });
  }, [deb]); // eslint-disable-line react-hooks/exhaustive-deps
  // Retour arrière / lien partagé : l'adresse change sans saisie → on resynchronise le champ.
  useEffect(() => { if (committed !== local.trim() && committed === '' ) setLocal(''); }, [committed]); // eslint-disable-line react-hooks/exhaustive-deps
  return [local, setLocal, local.trim() ? committed : ''];
}

export function Home() {
  const [params, setParams] = useSearchParams();
  const activity = params.get('activite') ?? '';
  const country = params.get('pays') ?? '';
  const destCountry = params.get('pays_arr') ?? '';
  const category = params.get('categorie') ?? '';
  const [city, setCity, dCity] = useUrlInput('ville');
  const [destCity, setDestCity, dDest] = useUrlInput('ville_arr');
  const [q, setQ, dQ] = useUrlInput('q');
  const [guests, setGuests, dGuests] = useUrlInput('guests');
  const [budget, setBudget, dBudget] = useUrlInput('budget');
  const { user } = useAuth();
  const myCompany = useMyCompany();
  const nav = useNavigate();
  const form: SearchForm | undefined = SEARCH_FORMS[activity as Activity];
  const cat = CATEGORIES[activity as Activity];
  const allCities = COUNTRIES.flatMap((c) => c.cities);
  useEffect(() => {
    if (params.get('pays')) return;
    try { const m = localStorage.getItem('bm-market'); if (m && COUNTRIES.some((c) => c.code === m)) setParams((p) => { const n = new URLSearchParams(p); n.set('pays', m); return n; }, { replace: true }); } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = (k: string, v: string) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (v) n.set(k, v); else n.delete(k);
    if (k === 'pays') { n.delete('ville'); setCity(''); }
    if (k === 'pays_arr') { n.delete('ville_arr'); setDestCity(''); }
    if (k === 'activite') { // chaque service a son propre formulaire : on repart de zéro
      for (const x of ['pays_arr', 'ville_arr', 'categorie', 'guests', 'budget']) n.delete(x);
      setDestCity(''); setGuests(''); setBudget('');
    }
    return n;
  }, { replace: true });

  const acts = useQuery({ queryKey: ['activities'], queryFn: () => unwrap(api.offers.activities.$get()), staleTime: 60_000 });
  const menu = acts.data ? MENU.filter((m) => m.members.some((x) => acts.data.activities.includes(x as Activity))) : MENU;
  // Un type masqué entre-temps par l'administration ne doit pas rester sélectionné.
  useEffect(() => { if (acts.data && activity && !menu.some((m) => m.id === activity)) setFilter('activite', ''); }); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useQuery({
    queryKey: ['offers', activity, country, dCity, destCountry, dDest, category, dGuests, dBudget, dQ],
    placeholderData: keepPreviousData,
    queryFn: () => unwrap(api.offers.$get({ query: {
      ...(activity ? { activity: (MENU.find((m) => m.id === activity)?.members ?? [activity]).join(',') } : {}),
      ...(country ? { country } : {}),
      ...(dCity ? { city: dCity } : {}),
      ...(destCountry ? { destCountry } : {}),
      ...(dDest ? { destCity: dDest } : {}),
      ...(category ? { category } : {}),
      ...(dGuests && Number(dGuests) > 0 ? { guests: Number(dGuests) } : {}),
      ...(dBudget && Number(dBudget) >= 0 ? { maxPrice: Number(dBudget) } : {}),
      ...(dQ ? { q: dQ } : {}),
    } })),
  });
  const shownMarket = country || (list.data?.market && COUNTRIES.some((c) => c.code === list.data!.market) ? list.data.market : '');
  const feat = useQuery({ queryKey: ['featured', shownMarket], staleTime: 60_000, queryFn: () => unwrap(api.offers.featured.$get({ query: shownMarket ? { country: shownMarket } : {} })) });
  const adsQ = useAds(shownMarket ?? '');
  const topAd = adsQ.data?.ads.find((a) => a.slot === 'home_top');
  const inlineAd = adsQ.data?.ads.find((a) => a.slot === 'home_inline');
  const filtered = !!(activity || country || destCountry || category || [city, destCity, q, guests, budget].some((x) => x.trim()));
  const reset = () => { setCity(''); setDestCity(''); setQ(''); setGuests(''); setBudget(''); setParams(new URLSearchParams(), { replace: true }); };
  const offers = list.data?.offers ?? [];
  // Pays de navigation : choisi par le visiteur, sinon détecté (géolocalisation de la plateforme). Les offres affichées sont celles des marchands de ce pays + les offres internationales.
  const market = list.data?.market ?? null;
  const african = !!market && COUNTRIES.some((c) => c.code === market);
  const shownCountry = country || (african ? market! : '');
  const cols = form ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3';

  // Partenaire : son « catalogue » est sa boutique (ses articles uniquement), pas l'ensemble de BackMarket.
  if (user?.role === 'owner' && myCompany.isLoading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (user?.role === 'owner' && myCompany.data) return <Navigate to={`/boutique/${myCompany.data.id}`} replace />;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[13rem_1fr]">
      <div><aside className="card md:fixed md:top-[101px] md:z-0 md:max-h-[calc(100vh-7rem)] md:w-52 md:overflow-y-auto" aria-label="Services BackMarket">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Services BackMarket</p>
        <div className="flex flex-wrap gap-2 md:flex-col md:flex-nowrap md:gap-1">
          {[{ id: '', label: 'Tous les services' }, ...menu].map((m) => (
            <button key={m.id} aria-pressed={activity === m.id} onClick={() => setFilter('activite', m.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-left text-sm transition ${activity === m.id ? 'bg-brand font-semibold text-black' : 'text-zinc-300 hover:bg-white/5'}`}>
              {m.label}
            </button>
          ))}
        </div>
      </aside></div>

      <div className="min-w-0 space-y-6">
        <section className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Réservez en Afrique, <span className="text-brand">simplement.</span></h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">Transport, hôtels, restaurants, loisirs, high-tech, mode et beauté auprès d’entreprises validées par BackMarket.</p>
          <div className="mt-3"><ShareButton label="Partager BackMarket" url={absUrl('/')} title={SITE.shareTitle} text={SITE.shareDescription} /></div>

          <form className={`card mt-5 grid gap-3 text-left ${cols}`} onSubmit={(e) => e.preventDefault()} role="search" aria-label={activity ? `Recherche ${MENU.find((m) => m.id === activity)?.label}` : 'Recherche'}>
            <PlaceFields id="f-dep" countryLabel={form?.from?.country ?? 'Pays'} cityLabel={form?.from?.city ?? 'Ville ou arrêt'}
              country={shownCountry} city={city} onCountry={(v) => { setFilter('pays', v); try { localStorage.setItem('bm-market', v); } catch { /* ignore */ } }} onCity={setCity} cities={shownCountry ? citiesOf(shownCountry) : allCities}
              allowAll={!african} allLabel={market && !african ? 'Autre pays : articles internationaux' : 'Tous les pays'} />
            {form?.to && (
              <PlaceFields id="f-arr" countryLabel={form.to.country} cityLabel={form.to.city}
                country={destCountry} city={destCity} onCountry={(v) => setFilter('pays_arr', v)} onCity={setDestCity} cities={destCountry ? citiesOf(destCountry) : allCities} />
            )}
            {form?.guests && (
              <div className="space-y-1"><label htmlFor="f-guests" className="text-xs text-zinc-400">{form.guests}</label>
                <input id="f-guests" type="number" min={1} max={500} inputMode="numeric" className="input" placeholder="1" value={guests} onChange={(e) => setGuests(e.target.value)} /></div>
            )}
            {form?.category && cat && (
              <div className="space-y-1"><label htmlFor="f-cat" className="text-xs text-zinc-400">{cat.label}</label>
                <select id="f-cat" className="input" value={category} onChange={(e) => setFilter('categorie', e.target.value)}>
                  <option value="">Tous</option>
                  {cat.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select></div>
            )}
            {form?.budget && (
              <div className="space-y-1"><label htmlFor="f-budget" className="text-xs text-zinc-400">{form.budget}</label>
                <input id="f-budget" type="number" min={0} step={500} inputMode="numeric" className="input" placeholder="Illimité" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            )}
            <div className={`space-y-1 ${form ? 'sm:col-span-2' : ''}`}>
              <label htmlFor="f-q" className="text-xs text-zinc-400">Rechercher</label>
              <input id="f-q" className="input" type="search" placeholder="Mot-clé…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </form>
          {!user && <p className="mt-3 text-sm text-zinc-400">Vous êtes une entreprise ? <Link to="/souscription" className="text-brand">Devenez partenaire BackMarket</Link></p>}
        </section>

        {topAd && !filtered && <AdBanner ad={topAd} />}

        {!filtered && !!feat.data?.offers.length && (
          <section aria-label="À la une" className="space-y-3">
            <h2 className="text-lg font-bold">★ À la une</h2>
            <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {feat.data.offers.map((o) => <OfferCard key={o.id} o={o} featured onBook={() => nav(`/reserver/${o.id}`)} />)}
            </div>
          </section>
        )}

        <div className="flex min-h-8 items-center justify-between gap-3" aria-live="polite">
          <p className="text-sm text-zinc-400">{list.isLoading ? 'Chargement des offres…' : `${offers.length} offre${offers.length > 1 ? 's' : ''}${filtered ? ' correspondante' + (offers.length > 1 ? 's' : '') : ''}`}</p>
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
            {offers.map((o, i) => (
              <Fragment key={o.id}>
                {inlineAd && i === Math.min(3, offers.length - 1) && <AdCard ad={inlineAd} />}
                <OfferCard o={o} onBook={() => nav(`/reserver/${o.id}`)} />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface OfferItem { scope?: string; category?: string | null; destCity?: string | null; destCountry?: string | null; id: string; title: string; description: string; priceFcfa: number; startsAt: string; remaining: number; country: string; city: string; stops: string[]; photoCount: number; companyName: string; companyLogo?: string | null; activity: string; ratingAvg?: number | null; ratingCount?: number }

/** Carte d'offre compacte : photo (ou visuel par défaut), titre, lieu, prix. Les détails s'ouvrent à la demande. */
export function OfferCard({ o, onBook, featured }: { o: OfferItem; onBook: () => void; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  const hasDetails = !!o.description || o.stops.length > 0;
  const low = o.remaining > 0 && o.remaining <= 3;
  return (
    <article className="card relative flex flex-col overflow-hidden !p-0 transition hover:border-white/25">
      <FavButton offerId={o.id} className="absolute right-2 top-2 z-[1]" />
      {featured && <span className="absolute left-2 top-2 z-[1] rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-black">★ À la une</span>}
      {o.photoCount > 0 && !broken ? (
        <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} loading="lazy" onError={() => setBroken(true)} className="aspect-[16/9] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-brand/25 to-white/5 text-3xl font-extrabold text-brand/70" aria-hidden>{(ACTIVITY_LABEL[o.activity] ?? '?').charAt(0)}</div>
      )}
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-brand">{ACTIVITY_LABEL[o.activity] ?? o.activity}{o.category ? ` · ${o.category}` : ''}{o.scope === 'international' ? ' · 🌍 International' : ''}</span>
        <h2 className="line-clamp-2 text-base font-semibold leading-snug"><Link to={`/offre/${o.id}`} className="hover:underline">{o.title}</Link></h2>
        {o.destCity && <p className="line-clamp-2 text-sm font-medium text-zinc-200">{placeLabel(o)}</p>}
        <p className="flex items-center gap-1.5 truncate text-sm text-zinc-400">{o.companyLogo && <img src={o.companyLogo} alt="" className="h-5 w-5 shrink-0 rounded-full bg-white object-cover" loading="lazy" />}<span className="truncate">{o.companyName}{o.destCity ? '' : ` · ${placeLabel(o)}`}</span></p>
        <RatingStars avg={o.ratingAvg} count={o.ratingCount} />
        <p className="pt-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${o.remaining < 1 ? 'bg-red-500/15 text-red-300' : low ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>{o.remaining < 1 ? 'Complet' : low ? `Plus que ${o.remaining} !` : `${o.remaining} disponibles`}</span>
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
        <div className="mt-auto space-y-3 border-t border-white/10 pt-3">
          <p className="text-xl font-extrabold leading-none">{o.priceFcfa > 0 ? fcfa(o.priceFcfa) : 'Gratuit'}</p>
          <div className="flex gap-2">
            <button className="btn flex-1" disabled={o.remaining < 1} onClick={onBook}>{o.remaining < 1 ? 'Complet' : 'Réserver'}</button>
            <ShareButton iconOnly className="btn-ghost !px-3" label="Partager cette offre" url={absUrl(`/offre/${o.id}`)} title={`${o.title} · ${o.priceFcfa > 0 ? fcfa(o.priceFcfa) : 'Gratuit'}`} text={`${o.companyName} sur ${SITE.name}`} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Pays + ville : liste déroulante des villes si un pays est choisi, sinon saisie libre avec suggestions. */
function PlaceFields({ id, countryLabel, cityLabel, country, city, onCountry, onCity, cities, allowAll = true, allLabel }: { allowAll?: boolean; allLabel?: string; id: string; countryLabel: string; cityLabel: string; country: string; city: string; onCountry: (v: string) => void; onCity: (v: string) => void; cities: string[] }) {
  return (
    <>
      <div className="space-y-1">
        <label htmlFor={`${id}-country`} className="text-xs text-zinc-400">{countryLabel}</label>
        <CountrySelect id={`${id}-country`} allowAll={allowAll} allLabel={allLabel} value={country} onChange={onCountry} />
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
