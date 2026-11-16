import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { PhotoPicker, compress, upload } from '../components/PhotoPicker';
import { ChipInput, CitySelect, CountrySelect } from '../components/ChipInput';
import { CompanyFields, coordsOk, draftFrom, emptyDraft, toPayload } from '../components/CompanyFields';
import { ACTIVITY_LABEL } from './Home';
import { placeLabel } from '../lib/place';
import { CATEGORIES, ROUTE_ACTIVITIES, SEARCH_FORMS } from '../../shared/search';
import { ACTIVITIES } from '../../shared/constants';
import { citiesOf, countryName } from '../../shared/geo';

type Activity = (typeof ACTIVITIES)[number];


type Tab = 'bookings' | 'offers' | 'settings';
const TABS: { id: Tab; label: string }[] = [{ id: 'bookings', label: 'Réservations clients' }, { id: 'offers', label: 'Mes offres' }, { id: 'settings', label: 'Paramètres' }];

export function CompanyDashboard() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('bookings');
  const co = useQuery({
    queryKey: ['company'],
    retry: false,
    queryFn: async () => {
      try { return (await unwrap(api.company.$get())).company; }
      catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
    },
  });
  const active = co.data?.status === 'active' || co.data?.status === 'suspended';
  const bookings = useQuery({ queryKey: ['company-bookings'], enabled: active, queryFn: () => unwrap(api.company.bookings.$get()), refetchInterval: 30_000 });
  const offers = useQuery({ queryKey: ['company-offers'], enabled: active, queryFn: () => unwrap(api.company.offers.$get()) });
  const refresh = () => { setEditing(false); qc.invalidateQueries({ queryKey: ['company'] }); };
  if (co.isLoading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (co.error) return <Err e={co.error} />;
  if (!co.data) return <CompanyForm mode="create" onDone={refresh} />;
  const c = co.data;
  if (c.status === 'rejected' && editing) return <CompanyForm mode="resubmit" initial={c} onDone={refresh} />;
  const confirmed = bookings.data?.bookings.filter((b) => b.status === 'confirmed').length ?? 0;
  const waiting = bookings.data?.bookings.filter((b) => b.status === 'pending_payment').length ?? 0;
  const liveOffers = offers.data?.offers.filter((o) => o.active && o.booked < o.capacity).length ?? 0;
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-3">
          {c.logoUrl && <img src={c.logoUrl} alt={`Logo ${c.name}`} className="h-14 w-14 rounded-xl bg-white object-cover" />}
          <div>
            <h1 className="text-2xl font-bold">{c.name}</h1>
            <p className="text-sm text-zinc-400">{ACTIVITY_LABEL[c.activity] ?? c.activity} · {c.city}, {countryName(c.country)}</p>
          </div>
        </div>
      </header>
      {c.status === 'pending' && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-300">Votre demande est en cours d’examen par BackMarket. Vos offres seront visibles une fois votre entreprise validée.</p>}
      {c.status === 'rejected' && (
        <div className="space-y-2 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          <p className="font-semibold">Votre demande a été refusée.</p>
          {c.reviewNote && <p>Motif : {c.reviewNote}</p>}
          <button className="btn mt-1" onClick={() => setEditing(true)}>Corriger et renvoyer ma demande</button>
        </div>
      )}
      {c.status === 'suspended' && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">Votre entreprise est suspendue. Contactez le support.</p>}
      {active && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Crédits restants" value={c.credits} hint="1 réservation = 1 crédit" accent />
            <Stat label="Réservations confirmées" value={confirmed} />
            <Stat label="En attente de paiement" value={waiting} />
            <Stat label="Offres en ligne" value={liveOffers} />
          </div>
          <div className="flex gap-1 border-b border-white/10" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.id ? 'border-brand text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}>{t.label}</button>
            ))}
          </div>
          {tab === 'bookings' && <Bookings q={bookings} />}
          {tab === 'offers' && <Offers company={{ country: c.country, city: c.city, activity: c.activity, serviceCities: c.serviceCities }} />}
          {tab === 'settings' && <><Profile company={c} /><ServiceCities country={c.country} cities={c.serviceCities} /></>}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: number; hint?: string; accent?: boolean }) {
  return (
    <div className="card !p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-brand' : ''}`}>{value}</p>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function CompanyForm({ mode, initial, onDone }: { mode: 'create' | 'resubmit'; initial?: Parameters<typeof draftFrom>[0]; onDone: () => void }) {
  const [f, setF] = useState(initial ? draftFrom(initial) : emptyDraft());
  const [localErr, setLocalErr] = useState('');
  const m = useMutation({
    mutationFn: () => {
      const json = toPayload(f);
      return unwrap(mode === 'create' ? api.company.$post({ json }) : api.company.resubmit.$post({ json }));
    },
    onSuccess: onDone,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!coordsOk(f)) return setLocalErr('Renseignez la géolocalisation de votre entreprise.'); setLocalErr(''); m.mutate(); }} className="card mx-auto max-w-lg space-y-4">
      <h1 className="text-center text-xl font-bold">{mode === 'create' ? 'Demande d’ouverture de compte fournisseur' : 'Corriger ma demande'}</h1>
      <Err e={localErr ? new Error(localErr) : m.error} />
      <CompanyFields value={f} onChange={setF} />
      <button className="btn w-full" disabled={m.isPending}>{mode === 'create' ? 'Envoyer pour validation' : 'Renvoyer ma demande'}</button>
    </form>
  );
}

function Profile({ company: c }: { company: { name: string; phone: string; email: string; logoUrl: string | null } }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: c.name, phone: c.phone, email: c.email });
  const [logo, setLogo] = useState<string | null>(c.logoUrl);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const cfg = useQuery({ queryKey: ['upload-config'], queryFn: () => unwrap(api.company['upload-config'].$get()), staleTime: Infinity });
  const save = useMutation({
    mutationFn: () => unwrap(api.company.profile.$patch({ json: { ...f, logoUrl: logo } })),
    onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: ['company'] }); },
  });
  const dirty = f.name !== c.name || f.phone !== c.phone || f.email !== c.email || logo !== c.logoUrl;
  const pick = async (files: FileList | null) => {
    const file = files?.[0]; if (!file || !cfg.data?.cloudinary) return;
    setErr(''); setBusy(true);
    try { setLogo(await upload(cfg.data.cloudinary, await compress(file, 512))); setSaved(false); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Erreur'); }
    setBusy(false); if (ref.current) ref.current.value = '';
  };
  const set = (k: 'name' | 'phone' | 'email', v: string) => { setF({ ...f, [k]: v }); setSaved(false); };
  return (
    <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <h2 className="text-lg font-semibold">Profil de l’entreprise</h2>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white text-xs text-zinc-500">
          {logo ? <img src={logo} alt="Logo" className="h-full w-full object-cover" /> : 'Aucun logo'}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost" disabled={busy || !cfg.data?.cloudinary} onClick={() => ref.current?.click()}>{busy ? 'Envoi…' : logo ? 'Changer le logo' : 'Ajouter un logo'}</button>
            {logo && <button type="button" className="btn-ghost" onClick={() => { setLogo(null); setSaved(false); }}>Retirer</button>}
          </div>
          <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files)} aria-label="Choisir un logo" />
          {cfg.data && !cfg.data.cloudinary && <p className="text-xs text-amber-300">L’envoi d’images n’est pas configuré sur la plateforme.</p>}
          <p className="text-xs text-zinc-500">Image carrée conseillée, réduite automatiquement.</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><label htmlFor="p-name" className="text-sm font-medium">Nom de l’entreprise</label>
          <input id="p-name" className="input" required minLength={2} maxLength={120} value={f.name} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="space-y-1"><label htmlFor="p-phone" className="text-sm font-medium">Téléphone</label>
          <input id="p-phone" className="input" type="tel" required value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
        <div className="space-y-1"><label htmlFor="p-email" className="text-sm font-medium">E-mail de contact</label>
          <input id="p-email" className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
      </div>
      <Err e={err ? new Error(err) : save.error} />
      <div className="flex items-center gap-3">
        <button className="btn" disabled={!dirty || save.isPending || busy}>{save.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
        {saved && !dirty && <span role="status" className="text-sm text-emerald-400">Profil mis à jour ✓</span>}
      </div>
    </form>
  );
}

function ServiceCities({ country, cities }: { country: string; cities: string[] }) {
  const qc = useQueryClient();
  const [values, setValues] = useState(cities);
  const save = useMutation({ mutationFn: () => unwrap(api.company.$patch({ json: { serviceCities: values } })), onSuccess: () => qc.invalidateQueries({ queryKey: ['company'] }) });
  const dirty = values.join('|') !== cities.join('|');
  return (
    <section className="card space-y-3">
      <ChipInput label="Villes de service" values={values} onChange={setValues} suggestions={citiesOf(country)} max={30} placeholder="Ajouter une ville" />
      <Err e={save.error} />
      {dirty && <button className="btn" disabled={save.isPending} onClick={() => save.mutate()}>Enregistrer</button>}
    </section>
  );
}

/** Vocabulaire par type d'activité (même logique de gestion pour tous). */
const NOUN: Record<string, { a: string; the: string }> = {
  transport: { a: 'un trajet', the: 'le trajet' }, restauration: { a: 'un plat', the: 'le plat' },
  expedition: { a: 'une expédition', the: "l'expédition" }, hotel: { a: 'une chambre', the: 'la chambre' },
  boutique: { a: 'un article', the: "l'article" }, agence_voyage: { a: 'un voyage', the: 'le voyage' },
  residence_meuble: { a: 'un logement', the: 'le logement' }, loisirs: { a: 'une activité', the: "l'activité" },
  location_vente: { a: 'un bien', the: 'le bien' },
  smartphones: { a: 'un smartphone', the: 'le smartphone' }, laptops: { a: 'un ordinateur portable', the: "l'ordinateur portable" },
  tablets: { a: 'une tablette', the: 'la tablette' },
  mode: { a: 'un article de mode', the: "l'article de mode" }, beaute: { a: 'un produit de beauté', the: 'le produit de beauté' },
};
const OWN_PHOTO = '/api/company/offers/';

function Offers({ company }: { company: { country: string; city: string; activity: string; serviceCities: string[] } }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['company-offers'], queryFn: () => unwrap(api.company.offers.$get()) });
  const blank = { title: '', description: '', country: company.country, city: company.city, destCountry: company.country, destCity: '', category: '', priceFcfa: 0, capacity: 1, available: true, allowCash: true };
  const [f, setF] = useState(blank);
  const [stops, setStops] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const isTransport = company.activity === 'transport';
  const isRoute = (ROUTE_ACTIVITIES as readonly string[]).includes(company.activity);
  const sf = SEARCH_FORMS[company.activity as keyof typeof SEARCH_FORMS];
  const cat = CATEGORIES[company.activity as keyof typeof CATEGORIES];
  const noun = NOUN[company.activity] ?? { a: 'une offre', the: "l'offre" };
  const reset = () => { setMissing([]); setF(blank); setStops([]); setPhotos([]); setEditing(null); };
  const close = () => { reset(); setOpen(false); };
  const refresh = () => qc.invalidateQueries({ queryKey: ['company-offers'] });
  const save = useMutation({
    mutationFn: () => {
      const { available, ...rest } = f;
      const json = { ...rest, active: available, category: f.category || null, ...(isRoute ? {} : { destCountry: null, destCity: null }), stops, photos: photos.map((p) => (p.startsWith(OWN_PHOTO) ? `keep:${p.split('/').pop()}` : p)) };
      return editing ? unwrap(api.company.offers[':id'].$patch({ param: { id: editing }, json })) : unwrap(api.company.offers.$post({ json }));
    },
    onSuccess: () => { close(); refresh(); },
  });
  const toggle = useMutation({
    mutationFn: (o: { id: string; active: boolean }) => unwrap(api.company.offers[':id'].$patch({ param: { id: o.id }, json: { active: o.active } })),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => unwrap(api.company.offers[':id'].$delete({ param: { id } })),
    onSuccess: refresh,
  });
  type Row = NonNullable<typeof list.data>['offers'][number];
  const load = (o: Row, copy: boolean) => {
    setF({ title: copy ? `${o.title} (copie)` : o.title, description: o.description, country: o.country, city: o.city, destCountry: o.destCountry ?? o.country, destCity: o.destCity ?? '', category: o.category ?? '', priceFcfa: o.priceFcfa, capacity: o.capacity, available: copy ? true : o.active, allowCash: o.allowCash });
    setStops(o.stops);
    setPhotos(copy ? [] : Array.from({ length: o.photoCount }, (_, i) => `${OWN_PHOTO}${o.id}/photos/${i}`));
    setEditing(copy ? null : o.id);
    save.reset(); setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }); // eslint-disable-line react-hooks/exhaustive-deps
  const [missing, setMissing] = useState<string[]>([]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const m: string[] = [];
    if (f.title.trim().length < 2) m.push('Titre');
    if (!f.city.trim()) m.push(isRoute ? sf?.from?.city ?? 'Ville' : 'Ville du service');
    if (isRoute && !f.destCity.trim()) m.push(sf?.to?.city ?? "Ville d'arrivée");
    if (cat && !f.category) m.push(cat.label);
    if (!(f.capacity >= 1)) m.push('Stock');
    setMissing(m);
    if (m.length) { requestAnimationFrame(() => document.getElementById('o-missing')?.scrollIntoView({ block: 'center', behavior: 'smooth' })); return; }
    save.mutate();
  };
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Mes offres</h2>
        <button className="btn" onClick={() => { reset(); save.reset(); setOpen(true); }}>+ Ajouter {noun.a}</button>
      </div>
      <Err e={toggle.error ?? remove.error} />
      {list.isLoading ? <p className="text-zinc-400">Chargement…</p> : !list.data?.offers.length ? (
        <p className="card text-center text-sm text-zinc-400">Aucune offre pour le moment. Cliquez sur « Ajouter {noun.a} » pour commencer.</p>
      ) : (
        <ul className="space-y-2">
          {list.data.offers.map((o) => (
            <li key={o.id} className={`card flex flex-wrap items-center justify-between gap-3 !py-3 ${o.active ? '' : 'opacity-70'}`}>
              {o.photoCount > 0 && <img src={`${OWN_PHOTO}${o.id}/photos/0`} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />}
              <div className="min-w-0 flex-1"><p className="font-medium">{o.title} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${o.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-zinc-300'}`}>{o.active ? 'Disponible' : 'Non disponible'}</span>{o.booked >= o.capacity && <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">Stock épuisé</span>}</p>
                <p className="text-sm text-zinc-400">{placeLabel(o)} · {fcfa(o.priceFcfa)} · Stock : {Math.max(0, o.capacity - o.booked)} restant(s) sur {o.capacity} · {o.allowCash ? 'Paiement à la livraison autorisé' : 'Paiement en ligne uniquement'} · Ajouté le {dateFr(o.startsAt)}</p>
                {o.stops.length > 0 && <p className="text-xs text-zinc-500">Arrêts : {o.stops.join(' · ')}</p>}</div>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${o.title}`}>
                <button className="btn-ghost" onClick={() => load(o, false)}>Modifier</button>
                <button className="btn-ghost" onClick={() => load(o, true)}>Dupliquer</button>
                <button className="btn-ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: o.id, active: !o.active })}>{o.active ? 'Marquer non disponible' : 'Marquer disponible'}</button>
                <button className="btn-ghost text-red-300" disabled={remove.isPending} onClick={() => confirm(`Supprimer « ${o.title} » définitivement ?`) && remove.mutate(o.id)}>Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-3 sm:p-4">
          <form role="dialog" aria-modal="true" aria-label={editing ? `Modifier ${noun.the}` : `Ajouter ${noun.a}`} onSubmit={submit} noValidate className="card grid max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl gap-3 overflow-y-auto overscroll-contain !py-0 sm:max-h-[calc(100dvh-2rem)] sm:grid-cols-2">
            <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between gap-2 border-b border-white/10 bg-card px-5 py-3 sm:col-span-2">
              <h3 className="text-lg font-semibold">{editing ? `Modifier ${noun.the}` : `Ajouter ${noun.a}`}</h3>
              <button type="button" className="btn-ghost !px-3" aria-label="Fermer" onClick={close}>✕</button>
            </div>
            <div className="space-y-1 sm:col-span-2"><label htmlFor="o-title" className="text-sm font-medium">Titre</label>
              <input id="o-title" className="input" required autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
            <div className="space-y-1"><label htmlFor="o-country" className="text-sm font-medium">{isRoute ? sf?.from?.country : 'Pays du service'}</label>
              <CountrySelect id="o-country" value={f.country} onChange={(v) => setF({ ...f, country: v, city: v === company.country ? company.city : '' })} /></div>
            <div className="space-y-1"><label htmlFor="o-city" className="text-sm font-medium">{isRoute ? sf?.from?.city : 'Ville du service'}</label>
              <CitySelect key={`${open}-${editing}-${f.country}`} id="o-city" required country={f.country} value={f.city} extra={f.country === company.country ? [company.city, ...company.serviceCities] : []} onChange={(v) => setF({ ...f, city: v })} /></div>
            {isRoute && (
              <>
                <div className="space-y-1"><label htmlFor="o-dcountry" className="text-sm font-medium">{sf?.to?.country}</label>
                  <CountrySelect id="o-dcountry" value={f.destCountry} onChange={(v) => setF({ ...f, destCountry: v, destCity: '' })} /></div>
                <div className="space-y-1"><label htmlFor="o-dcity" className="text-sm font-medium">{sf?.to?.city}</label>
                  <CitySelect key={`d-${open}-${editing}-${f.destCountry}`} id="o-dcity" required country={f.destCountry} value={f.destCity} extra={[]} onChange={(v) => setF({ ...f, destCity: v })} /></div>
              </>
            )}
            {cat && (
              <div className="space-y-1 sm:col-span-2"><label htmlFor="o-cat" className="text-sm font-medium">{cat.label}</label>
                <select id="o-cat" className="input" required value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                  <option value="">Choisir…</option>
                  {cat.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select></div>
            )}
            <div className="sm:col-span-2">
              <ChipInput label={isTransport ? 'Arrêts (villes ou lieux indiqués)' : 'Lieux / points de rendez-vous (facultatif)'}
                hint="Le client choisira l’un de ces arrêts en réservant." values={stops} onChange={setStops} max={20} placeholder="Ex. Gare de Ouaga Nord" />
            </div>
            <div className="space-y-1"><label htmlFor="o-avail" className="text-sm font-medium">Disponibilité</label>
              <select id="o-avail" className="input" value={f.available ? 'yes' : 'no'} onChange={(e) => setF({ ...f, available: e.target.value === 'yes' })}>
                <option value="yes">Disponible</option><option value="no">Non disponible</option>
              </select></div>
            <div className="space-y-1"><label htmlFor="o-price" className="text-sm font-medium">Prix (FCFA)</label>
              <input id="o-price" className="input" type="number" min={0} required value={f.priceFcfa} onChange={(e) => setF({ ...f, priceFcfa: Number(e.target.value) })} /></div>
            <div className="space-y-1"><label htmlFor="o-cap" className="text-sm font-medium">Stock disponible</label>
              <input id="o-cap" className="input" type="number" min={1} required value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} /></div>
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input type="checkbox" className="mt-1" checked={f.allowCash} onChange={(e) => setF({ ...f, allowCash: e.target.checked })} />
              <span><span className="font-medium">Autoriser le paiement à la livraison</span><span className="block text-xs text-zinc-400">Si décoché, le client doit payer en ligne (Mobile Money). Sans effet sur les offres gratuites.</span></span>
            </label>
            <div className="space-y-1 sm:col-span-2"><label htmlFor="o-desc" className="text-sm font-medium">Description</label>
              <textarea id="o-desc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div className="sm:col-span-2"><PhotoPicker value={photos} onChange={setPhotos} /></div>
            {missing.length > 0 && <p id="o-missing" role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 sm:col-span-2">Veuillez renseigner : {missing.join(', ')}.</p>}
            <div className="sm:col-span-2"><Err e={save.error} /></div>
            <div className="sticky bottom-0 z-10 -mx-5 flex justify-end gap-2 border-t border-white/10 bg-card px-5 py-3 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={close}>Annuler</button>
              <button className="btn" disabled={save.isPending}>{editing ? 'Enregistrer les modifications' : "Publier l'offre"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmée', cls: 'bg-emerald-500/15 text-emerald-300' },
  pending_payment: { label: 'Paiement en attente', cls: 'bg-amber-500/15 text-amber-300' },
  cancelled: { label: 'Annulée', cls: 'bg-white/10 text-zinc-400' },
};
const FILTERS = [{ id: '', label: 'Toutes' }, { id: 'confirmed', label: 'Confirmées' }, { id: 'pending_payment', label: 'En attente' }, { id: 'cancelled', label: 'Annulées' }];

function Bookings({ q }: { q: { data?: { bookings: { id: string; seats: number; stop: string | null; status: string; createdAt: string; offerTitle: string; customerName: string; reference: string; contactPhone: string | null; guests: string[]; note: string; paymentStatus: string | null; amountFcfa: number | null; payMethod: string; dueFcfa: number }[] }; isLoading: boolean; error: unknown } }) {
  const [filter, setFilter] = useState('');
  const rows = (q.data?.bookings ?? []).filter((b) => !filter || b.status === filter);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Historique des réservations</h2>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par statut">
          {FILTERS.map((x) => (
            <button key={x.id} aria-pressed={filter === x.id} onClick={() => setFilter(x.id)}
              className={`rounded-full border px-3 py-1 text-xs ${filter === x.id ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{x.label}</button>
          ))}
        </div>
      </div>
      <Err e={q.error} />
      {q.isLoading ? <p className="text-zinc-400">Chargement…</p> : !rows.length ? (
        <p className="card text-center text-sm text-zinc-400">{filter ? 'Aucune réservation dans cette catégorie.' : 'Aucune réservation pour le moment.'}</p>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
              <tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Réf.</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Offre</th><th className="px-4 py-3 font-medium">Places</th><th className="px-4 py-3 font-medium">Montant</th><th className="px-4 py-3 font-medium">Statut</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((b) => {
                const st = BOOKING_STATUS[b.status] ?? { label: b.status, cls: 'bg-white/10' };
                return (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{dateFr(b.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{b.reference}</td>
                    <td className="px-4 py-3 font-medium">{b.customerName}{b.contactPhone && <span className="block text-xs font-normal text-zinc-400">{b.contactPhone}</span>}{b.guests.length > 0 && <span className="block text-xs font-normal text-zinc-500">{b.guests.join(', ')}</span>}{b.note && <span className="block text-xs font-normal italic text-zinc-500">« {b.note} »</span>}</td>
                    <td className="px-4 py-3">{b.offerTitle}{b.stop && <span className="block text-xs text-zinc-500">Arrêt : {b.stop}</span>}</td>
                    <td className="px-4 py-3">{b.seats}</td>
                    <td className="whitespace-nowrap px-4 py-3">{b.amountFcfa ? fcfa(b.amountFcfa) : b.payMethod === 'cash' && b.dueFcfa > 0 ? <>{fcfa(b.dueFcfa)}<span className="block text-xs text-amber-300">À encaisser à la livraison</span></> : <span className="text-zinc-500">Gratuit</span>}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
