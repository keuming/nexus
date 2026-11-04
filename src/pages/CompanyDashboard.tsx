import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { ACTIVITIES } from '../../shared/constants';

export function CompanyDashboard() {
  const qc = useQueryClient();
  const co = useQuery({
    queryKey: ['company'],
    retry: false,
    queryFn: async () => {
      try { return (await unwrap(api.company.$get())).company; }
      catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; }
    },
  });
  if (co.isLoading) return <p className="text-zinc-400">Chargement…</p>;
  if (co.error) return <Err e={co.error} />;
  if (!co.data) return <CreateCompany onDone={() => qc.invalidateQueries({ queryKey: ['company'] })} />;
  const c = co.data;
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{c.name}</h1>
        <p className="text-sm text-zinc-400">{c.activity} · {c.city}</p>
      </header>
      {c.status === 'pending' && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">Votre entreprise est en attente de validation par NEXUS. Vos offres seront visibles une fois validée.</p>}
      {c.status === 'suspended' && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">Votre entreprise est suspendue. Contactez le support.</p>}
      <div className="card inline-block"><p className="text-sm text-zinc-400">Crédits restants</p><p className="text-3xl font-bold text-brand">{c.credits}</p><p className="text-xs text-zinc-500">1 réservation = 1 crédit</p></div>
      <Offers />
      <Bookings />
    </div>
  );
}

function CreateCompany({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: '', activity: ACTIVITIES[0] as (typeof ACTIVITIES)[number], city: '' });
  const m = useMutation({ mutationFn: () => unwrap(api.company.$post({ json: f })), onSuccess: onDone });
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} className="card mx-auto max-w-md space-y-3">
      <h1 className="text-xl font-bold">Créer mon entreprise</h1>
      <Err e={m.error} />
      <input className="input" required placeholder="Nom de l'entreprise" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <select className="input" value={f.activity} onChange={(e) => setF({ ...f, activity: e.target.value as typeof f.activity })}>
        {ACTIVITIES.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
      </select>
      <input className="input" required placeholder="Ville" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
      <button className="btn w-full" disabled={m.isPending}>Envoyer pour validation</button>
    </form>
  );
}

function Offers() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['company-offers'], queryFn: () => unwrap(api.company.offers.$get()) });
  const [f, setF] = useState({ title: '', description: '', priceFcfa: 0, capacity: 1, startsAt: '' });
  const add = useMutation({
    mutationFn: () => unwrap(api.company.offers.$post({ json: { ...f, startsAt: new Date(f.startsAt).toISOString() } })),
    onSuccess: () => { setF({ title: '', description: '', priceFcfa: 0, capacity: 1, startsAt: '' }); qc.invalidateQueries({ queryKey: ['company-offers'] }); },
  });
  const toggle = useMutation({
    mutationFn: (o: { id: string; active: boolean }) => unwrap(api.company.offers[':id'].$patch({ param: { id: o.id }, json: { active: o.active } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-offers'] }),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); add.mutate(); };
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Mes offres</h2>
      <form onSubmit={submit} className="card grid gap-3 sm:grid-cols-2">
        <input className="input" required placeholder="Titre" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="input" type="datetime-local" required value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} />
        <input className="input" type="number" min={0} required placeholder="Prix (FCFA)" value={f.priceFcfa} onChange={(e) => setF({ ...f, priceFcfa: Number(e.target.value) })} />
        <input className="input" type="number" min={1} required placeholder="Places" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} />
        <textarea className="input sm:col-span-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <div className="sm:col-span-2"><Err e={add.error ?? toggle.error} /></div>
        <button className="btn sm:col-span-2" disabled={add.isPending}>Publier l'offre</button>
      </form>
      <ul className="space-y-2">
        {list.data?.offers.map((o) => (
          <li key={o.id} className="card flex items-center justify-between gap-3 !py-3">
            <div><p className="font-medium">{o.title}</p><p className="text-sm text-zinc-400">{dateFr(o.startsAt)} · {fcfa(o.priceFcfa)} · {o.booked}/{o.capacity}</p></div>
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
      <h2 className="text-lg font-semibold">Réservations reçues</h2>
      {!q.data?.bookings.length ? <p className="text-sm text-zinc-400">Aucune réservation.</p> : (
        <ul className="space-y-2">{q.data.bookings.map((b) => (
          <li key={b.id} className="card !py-3 text-sm">{b.customerName} — {b.offerTitle} · {b.seats} place(s) · {dateFr(b.createdAt)} {b.status === 'cancelled' && <em className="text-zinc-500">(annulée)</em>}</li>
        ))}</ul>
      )}
    </section>
  );
}
