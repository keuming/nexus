import { useState, type FormEvent } from 'react';
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

function Offers({ company }: { company: { country: string; city: string; activity: string; serviceCities: string[] } }) {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['company-offers'], queryFn: () => unwrap(api.company.offers.$get()) });
  const blank = { title: '', description: '', country: company.country, city: company.city, priceFcfa: 0, capacity: 1, startsAt: '' };
  const [f, setF] = useState(blank);
  const [stops, setStops] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const isTransport = company.activity === 'transport';
  const add = useMutation({
    mutationFn: () => unwrap(api.company.offers.$post({ json: { ...f, stops, photos, startsAt: new Date(f.startsAt).toISOString() } })),
    onSuccess: () => { setF(blank); setStops([]); setPhotos([]); qc.invalidateQueries({ queryKey: ['company-offers'] }); },
  });
  const toggle = useMutation({
    mutationFn: (o: { id: string; active: boolean }) => unwrap(api.company.offers[':id'].$patch({ param: { id: o.id }, json: { active: o.active } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-offers'] }),
  });
  const cityOptions = [...new Set([company.city, ...company.serviceCities, ...citiesOf(f.country)])];
  const submit = (e: FormEvent) => { e.preventDefault(); add.mutate(); };
  return (
    <section className="space-y-4">
      <h2 className="text-center text-lg font-semibold">Mes offres</h2>
      <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
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
        <div className="sm:col-span-2"><Err e={add.error ?? toggle.error} /></div>
        <button className="btn sm:col-span-2" disabled={add.isPending}>Publier l'offre</button>
      </form>
      <ul className="space-y-2">
        {list.data?.offers.map((o) => (
          <li key={o.id} className="card flex items-center justify-between gap-3 !py-3">
            {o.photoCount > 0 && <img src={`/api/offers/${o.id}/photos/0`} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />}
            <div className="min-w-0 flex-1"><p className="font-medium">{o.title}</p>
              <p className="text-sm text-zinc-400">{o.city ? `${o.city} → ` : ''}{countryName(o.country)} · {dateFr(o.startsAt)} · {fcfa(o.priceFcfa)} · {o.booked}/{o.capacity}</p>
              {o.stops.length > 0 && <p className="text-xs text-zinc-500">Arrêts : {o.stops.join(' · ')}</p>}</div>
            <button className="btn-ghost" onClick={() => toggle.mutate({ id: o.id, active: !o.active })}>{o.active ? 'Désactiver' : 'Activer'}</button>
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
