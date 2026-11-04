import { useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { PhotoPicker } from '../components/PhotoPicker';
import { ChipInput, CountrySelect } from '../components/ChipInput';
import { CompanyFields, coordsOk, draftFrom, emptyDraft, toPayload } from '../components/CompanyFields';
import { ACTIVITY_LABEL } from './Home';
import { ACTIVITIES } from '../../shared/constants';
import { citiesOf, countryName } from '../../shared/geo';

type Activity = (typeof ACTIVITIES)[number];

export function CompanyDashboard() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const co = useQuery({
    queryKey: ['company'],
    retry: false,
    queryFn: async () => {
      try { return (await unwrap(api.company.$get())).company; }
      catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
    },
  });
  const refresh = () => { setEditing(false); qc.invalidateQueries({ queryKey: ['company'] }); };
  if (co.isLoading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (co.error) return <Err e={co.error} />;
  if (!co.data) return <CompanyForm mode="create" onDone={refresh} />;
  const c = co.data;
  if (c.status === 'rejected' && editing) return <CompanyForm mode="resubmit" initial={c} onDone={refresh} />;
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{c.name}</h1>
        <p className="text-sm text-zinc-400">{ACTIVITY_LABEL[c.activity] ?? c.activity} · {c.city}, {countryName(c.country)}</p>
      </header>
      {c.status === 'pending' && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-300">Votre demande est en cours d’examen par NEXUS. Vos offres seront visibles une fois votre entreprise validée.</p>}
      {c.status === 'rejected' && (
        <div className="space-y-2 rounded-lg bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          <p className="font-semibold">Votre demande a été refusée.</p>
          {c.reviewNote && <p>Motif : {c.reviewNote}</p>}
          <button className="btn mt-1" onClick={() => setEditing(true)}>Corriger et renvoyer ma demande</button>
        </div>
      )}
      {c.status === 'suspended' && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-300">Votre entreprise est suspendue. Contactez le support.</p>}
      {(c.status === 'active' || c.status === 'suspended') && (
        <>
          <div className="card mx-auto max-w-xs text-center"><p className="text-sm text-zinc-400">Crédits restants</p><p className="text-3xl font-bold text-brand">{c.credits}</p><p className="text-xs text-zinc-500">1 réservation = 1 crédit</p></div>
          <ServiceCities country={c.country} cities={c.serviceCities} />
          <Offers company={{ country: c.country, city: c.city, activity: c.activity, serviceCities: c.serviceCities }} />
          <Bookings />
        </>
      )}
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
};
const toLocalInput = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const OWN_PHOTO = '/api/company/offers/';

function Offers({ company }: { company: { country: string; city: string; activity: string; serviceCities: string[] } }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['company-offers'], queryFn: () => unwrap(api.company.offers.$get()) });
  const blank = { title: '', description: '', country: company.country, city: company.city, priceFcfa: 0, capacity: 1, startsAt: '' };
  const [f, setF] = useState(blank);
  const [stops, setStops] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const isTransport = company.activity === 'transport';
  const noun = NOUN[company.activity] ?? { a: 'une offre', the: "l'offre" };
  const reset = () => { setF(blank); setStops([]); setPhotos([]); setEditing(null); };
  const refresh = () => qc.invalidateQueries({ queryKey: ['company-offers'] });
  const save = useMutation({
    mutationFn: () => {
      const json = { ...f, stops, startsAt: new Date(f.startsAt).toISOString(), photos: photos.map((p) => (p.startsWith(OWN_PHOTO) ? `keep:${p.split('/').pop()}` : p)) };
      return editing ? unwrap(api.company.offers[':id'].$patch({ param: { id: editing }, json })) : unwrap(api.company.offers.$post({ json }));
    },
    onSuccess: () => { reset(); refresh(); },
  });
  const toggle = useMutation({
    mutationFn: (o: { id: string; active: boolean }) => unwrap(api.company.offers[':id'].$patch({ param: { id: o.id }, json: { active: o.active } })),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => unwrap(api.company.offers[':id'].$delete({ param: { id } })),
    onSuccess: (_r, id) => { if (editing === id) reset(); refresh(); },
  });
  type Row = NonNullable<typeof list.data>['offers'][number];
  const load = (o: Row, copy: boolean) => {
    setF({ title: copy ? `${o.title} (copie)` : o.title, description: o.description, country: o.country, city: o.city, priceFcfa: o.priceFcfa, capacity: o.capacity, startsAt: copy ? '' : toLocalInput(o.startsAt) });
    setStops(o.stops);
    setPhotos(copy ? [] : Array.from({ length: o.photoCount }, (_, i) => `${OWN_PHOTO}${o.id}/photos/${i}`));
    setEditing(copy ? null : o.id);
    form.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const cityOptions = [...new Set([company.city, ...company.serviceCities, ...citiesOf(f.country)])];
  const submit = (e: FormEvent) => { e.preventDefault(); save.mutate(); };
  return (
    <section className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Mes offres</h2>
      <form ref={form} onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 sm:col-span-2">
          <h3 className="font-semibold">{editing ? `Modifier ${noun.the}` : `Ajouter ${noun.a}`}</h3>
          {editing && <button type="button" className="btn-ghost" onClick={reset}>Annuler la modification</button>}
        </div>
        <div className="space-y-1 sm:col-span-2"><label htmlFor="o-title" className="text-sm font-medium">Titre</label>
          <input id="o-title" className="input" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="space-y-1"><label htmlFor="o-country" className="text-sm font-medium">{isTransport ? 'Pays de destination' : 'Pays du service'}</label>
          <CountrySelect id="o-country" value={f.country} onChange={(v) => setF({ ...f, country: v })} /></div>
        <div className="space-y-1"><label htmlFor="o-city" className="text-sm font-medium">{isTransport ? 'Ville de départ' : 'Ville du service'}</label>
          <input id="o-city" className="input" required list="o-cities" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          <datalist id="o-cities">{cityOptions.map((c) => <option key={c} value={c} />)}</datalist></div>
        <div className="sm:col-span-2">
          <ChipInput label={isTransport ? 'Arrêts (villes ou lieux indiqués)' : 'Lieux / points de rendez-vous (facultatif)'}
            hint="Le client choisira l’un de ces arrêts en réservant." values={stops} onChange={setStops} max={20} placeholder="Ex. Gare de Ouaga Nord" />
        </div>
        <div className="space-y-1"><label htmlFor="o-date" className="text-sm font-medium">Date et heure</label>
          <input id="o-date" className="input" type="datetime-local" required value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></div>
        <div className="space-y-1"><label htmlFor="o-price" className="text-sm font-medium">Prix (FCFA)</label>
          <input id="o-price" className="input" type="number" min={0} required value={f.priceFcfa} onChange={(e) => setF({ ...f, priceFcfa: Number(e.target.value) })} /></div>
        <div className="space-y-1"><label htmlFor="o-cap" className="text-sm font-medium">Places</label>
          <input id="o-cap" className="input" type="number" min={1} required value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} /></div>
        <div className="space-y-1 sm:col-span-2"><label htmlFor="o-desc" className="text-sm font-medium">Description</label>
          <textarea id="o-desc" className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="sm:col-span-2"><PhotoPicker value={photos} onChange={setPhotos} /></div>
        <div className="sm:col-span-2"><Err e={save.error ?? toggle.error ?? remove.error} /></div>
        <button className="btn sm:col-span-2" disabled={save.isPending}>{editing ? 'Enregistrer les modifications' : "Publier l'offre"}</button>
      </form>
      <ul className="space-y-2">
        {list.data?.offers.map((o) => (
          <li key={o.id} className={`card flex flex-wrap items-center justify-between gap-3 !py-3 ${editing === o.id ? 'border-brand' : ''} ${o.active ? '' : 'opacity-70'}`}>
            {o.photoCount > 0 && <img src={`${OWN_PHOTO}${o.id}/photos/0`} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />}
            <div className="min-w-0 flex-1"><p className="font-medium">{o.title} {!o.active && <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">Désactivé</span>}</p>
              <p className="text-sm text-zinc-400">{o.city ? `${o.city} → ` : ''}{countryName(o.country)} · {dateFr(o.startsAt)} · {fcfa(o.priceFcfa)} · {o.booked}/{o.capacity}</p>
              {o.stops.length > 0 && <p className="text-xs text-zinc-500">Arrêts : {o.stops.join(' · ')}</p>}</div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Actions pour ${o.title}`}>
              <button className="btn-ghost" onClick={() => load(o, false)}>Modifier</button>
              <button className="btn-ghost" onClick={() => load(o, true)}>Dupliquer</button>
              <button className="btn-ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: o.id, active: !o.active })}>{o.active ? 'Désactiver' : 'Activer'}</button>
              <button className="btn-ghost text-red-300" disabled={remove.isPending} onClick={() => confirm(`Supprimer « ${o.title} » définitivement ?`) && remove.mutate(o.id)}>Supprimer</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bookings() {
  const q = useQuery({ queryKey: ['company-bookings'], queryFn: () => unwrap(api.company.bookings.$get()) });
  return (
    <section className="space-y-3">
      <h2 className="text-center text-lg font-semibold">Réservations reçues</h2>
      {!q.data?.bookings.length ? <p className="text-center text-sm text-zinc-400">Aucune réservation.</p> : (
        <ul className="space-y-2">{q.data.bookings.map((b) => (
          <li key={b.id} className="card !py-3 text-sm">{b.customerName} — {b.offerTitle}{b.stop ? ` · arrêt : ${b.stop}` : ''} · {b.seats} place(s) · {dateFr(b.createdAt)} {b.status === 'cancelled' && <em className="text-zinc-500">(annulée)</em>}{b.status === 'pending_payment' && <em className="text-amber-400">(paiement en attente)</em>}{b.paymentStatus === 'paid' && <em className="text-emerald-400">(payée {fcfa(b.amountFcfa ?? 0)})</em>}</li>
        ))}</ul>
      )}
    </section>
  );
}
