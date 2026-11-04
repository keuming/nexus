import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { countryName } from '../../shared/geo';
import { CREDIT_PRICE_FCFA } from '../../shared/constants';
import { ACTIVITY_LABEL } from './Home';

const STATUS_FR: Record<string, string> = { pending: 'en attente', active: 'active', suspended: 'suspendue', rejected: 'refusée' };

type Tab = 'pending' | 'active' | 'suspended' | 'rejected' | '' | 'payments';
const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Demandes à valider' }, { id: 'active', label: 'Actives' },
  { id: 'suspended', label: 'Suspendues' }, { id: 'rejected', label: 'Refusées' }, { id: '', label: 'Toutes' }, { id: 'payments', label: 'Paiements' },
];

export function AdminDashboard() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => unwrap(api.admin.stats.$get()) });
  const list = useQuery({ queryKey: ['admin-companies', tab], queryFn: () => unwrap(api.admin.companies.$get({ query: tab && tab !== 'payments' ? { status: tab } : {} })), enabled: tab !== 'payments' });
  const inv = () => { qc.invalidateQueries({ queryKey: ['admin-companies'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); };
  const review = useMutation({
    mutationFn: (v: { id: string; decision: 'approve' | 'reject'; note?: string }) => unwrap(api.admin.companies[':id'].review.$post({ param: { id: v.id }, json: { decision: v.decision, note: v.note ?? '' } })),
    onSuccess: inv,
  });
  const setSt = useMutation({
    mutationFn: (v: { id: string; status: 'active' | 'suspended' }) => unwrap(api.admin.companies[':id'].status.$post({ param: { id: v.id }, json: { status: v.status } })),
    onSuccess: inv,
  });
  const topup = useMutation({
    mutationFn: (v: { id: string; credits: number }) => unwrap(api.admin.companies[':id'].credits.$post({ param: { id: v.id }, json: { credits: v.credits } })),
    onSuccess: inv,
  });
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState('');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-center text-2xl font-bold">Administration</h1>
      {stats.data && <p className="text-center text-sm text-zinc-400">{stats.data.users} utilisateurs · {stats.data.companies} entreprises · {stats.data.bookings} réservations</p>}
      <div className="flex flex-wrap justify-center gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`rounded-full border px-3 py-1 text-sm ${tab === t.id ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>
            {t.label}{t.id === 'pending' && stats.data?.pending ? ` (${stats.data.pending})` : ''}{t.id === 'payments' && stats.data?.needsRefund ? ` ⚠ ${stats.data.needsRefund}` : ''}
          </button>
        ))}
      </div>
      <Err e={list.error ?? review.error ?? setSt.error ?? topup.error} />
      {tab === 'payments' && <PaymentsAdmin />}
      {tab !== 'payments' && !list.data?.companies.length && !list.isLoading && <p className="text-center text-zinc-400">{tab === 'pending' ? 'Aucune demande en attente.' : 'Aucune entreprise.'}</p>}
      <ul className="space-y-3">
        {tab !== 'payments' && list.data?.companies.map((c) => {
          const digits = c.phone.replace(/\D/g, '');
          return (
            <li key={c.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold">{c.name} <span className="text-xs font-normal text-zinc-500">({STATUS_FR[c.status] ?? c.status})</span></p>
                  <p className="text-sm text-zinc-400">{ACTIVITY_LABEL[c.activity] ?? c.activity} · {c.city}, {countryName(c.country)}</p>
                </div>
                <p className="text-xs text-zinc-500">Demande du {dateFr(c.createdAt)}</p>
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <div className="sm:col-span-2"><dt className="inline text-zinc-500">Gérant : </dt><dd className="inline">{c.ownerName}{c.managerTitle ? ` (${c.managerTitle})` : ''} · {c.ownerEmail}{c.ownerPhone ? ` · ${c.ownerPhone}` : ''}</dd></div>
                <div><dt className="inline text-zinc-500">Adresse : </dt><dd className="inline">{c.address || '—'}</dd></div>
                <div><dt className="inline text-zinc-500">Position : </dt><dd className="inline">{c.latitude != null && c.longitude != null
                  ? <a className="text-brand" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}#map=17/${c.latitude}/${c.longitude}`}>{c.latitude.toFixed(5)}, {c.longitude.toFixed(5)} (carte)</a> : '—'}</dd></div>
                {c.companyEmail && <div><dt className="inline text-zinc-500">E-mail entreprise : </dt><dd className="inline">{c.companyEmail}</dd></div>}
                <div><dt className="inline text-zinc-500">Téléphone entreprise : </dt><dd className="inline">{c.phone ? <>
                  <a className="text-brand" href={`tel:${c.phone}`}>{c.phone}</a>{' · '}<a className="text-brand" target="_blank" rel="noreferrer" href={`https://wa.me/${digits}`}>WhatsApp</a></> : '—'}</dd></div>
                <div><dt className="inline text-zinc-500">RCCM : </dt><dd className="inline">{c.rccm || '—'}</dd></div>
                <div><dt className="inline text-zinc-500">Crédits : </dt><dd className="inline">{c.credits}</dd></div>
                <div className="sm:col-span-2"><dt className="inline text-zinc-500">Villes de service : </dt><dd className="inline">{c.serviceCities.length ? c.serviceCities.join(', ') : '—'}</dd></div>
                {c.reviewNote && <div className="sm:col-span-2"><dt className="inline text-zinc-500">Dernière décision : </dt><dd className="inline">{c.reviewNote}</dd></div>}
              </dl>

              {rejecting === c.id ? (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); review.mutate({ id: c.id, decision: 'reject', note }, { onSuccess: () => { setRejecting(null); setNote(''); } }); }}>
                  <label htmlFor={`note-${c.id}`} className="text-sm font-medium">Motif du refus (visible par le fournisseur)</label>
                  <textarea id={`note-${c.id}`} className="input" required minLength={5} maxLength={500} autoFocus value={note} onChange={(e) => setNote(e.target.value)} />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-ghost" onClick={() => { setRejecting(null); setNote(''); }}>Annuler</button>
                    <button className="btn" disabled={review.isPending}>Confirmer le refus</button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap justify-end gap-2">
                  {c.status === 'pending' && <button className="btn-ghost" onClick={() => { setRejecting(c.id); setNote(''); }}>Refuser</button>}
                  {(c.status === 'pending' || c.status === 'rejected') && <button className="btn" disabled={review.isPending} onClick={() => review.mutate({ id: c.id, decision: 'approve' })}>Approuver</button>}
                  {c.status === 'active' && <button className="btn-ghost" onClick={() => setSt.mutate({ id: c.id, status: 'suspended' })}>Suspendre</button>}
                  {c.status === 'suspended' && <button className="btn" onClick={() => setSt.mutate({ id: c.id, status: 'active' })}>Réactiver</button>}
                  {(c.status === 'active' || c.status === 'suspended') && (
                    <button className="btn-ghost" onClick={() => {
                      const n = Number(prompt(`Crédits à ajouter (1 crédit = ${fcfa(CREDIT_PRICE_FCFA)}) :`));
                      if (Number.isInteger(n) && n > 0) topup.mutate({ id: c.id, credits: n });
                    }}>+ Crédits</button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const PAY_FR: Record<string, string> = { pending: 'en attente', paid: 'payé', failed: 'échoué', expired: 'expiré', needs_refund: 'REMBOURSEMENT À FAIRE', refunded: 'remboursé' };

/** Paiements ORZAYAH : suivi, remboursements à effectuer, sommes à reverser aux fournisseurs. */
function PaymentsAdmin() {
  const qc = useQueryClient();
  const pays = useQuery({ queryKey: ['admin-payments'], queryFn: () => unwrap(api.admin.payments.$get()) });
  const due = useQuery({ queryKey: ['admin-payouts'], queryFn: () => unwrap(api.admin.payouts.$get()) });
  const pay = useMutation({
    mutationFn: (id: string) => unwrap(api.admin.companies[':id'].payouts.$post({ param: { id } })),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-payouts'] }); qc.invalidateQueries({ queryKey: ['admin-payments'] }); },
  });
  return (
    <div className="space-y-6">
      <Err e={pays.error ?? due.error ?? pay.error} />
      <section className="space-y-2">
        <h2 className="text-center text-lg font-semibold">À reverser aux fournisseurs</h2>
        {!due.data?.payouts.length ? <p className="text-center text-sm text-zinc-400">Rien à reverser.</p> : (
          <ul className="space-y-2">{due.data.payouts.map((r) => (
            <li key={r.companyId} className="card flex items-center justify-between gap-3 !py-3 text-sm">
              <span><strong>{r.companyName}</strong> · {r.count} paiement(s) · {fcfa(r.totalFcfa)}</span>
              <button className="btn-ghost" disabled={pay.isPending} onClick={() => confirm(`Confirmer que ${fcfa(r.totalFcfa)} ont été reversés à ${r.companyName} ?`) && pay.mutate(r.companyId)}>Marquer reversé</button>
            </li>
          ))}</ul>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-center text-lg font-semibold">Paiements récents</h2>
        {!pays.data?.payments.length ? <p className="text-center text-sm text-zinc-400">Aucun paiement.</p> : (
          <ul className="space-y-2">{pays.data.payments.map((p) => (
            <li key={p.id} className={`card !py-3 text-sm ${p.status === 'needs_refund' ? 'border-amber-500' : ''}`}>
              <strong className={p.status === 'needs_refund' ? 'text-amber-400' : ''}>{PAY_FR[p.status] ?? p.status}</strong> · {fcfa(p.amountFcfa)} · {p.operator} · {p.customerName} → {p.companyName} · {dateFr(p.createdAt)}
              {p.orzRef && <span className="text-zinc-500"> · réf. {p.orzRef}</span>}{p.reversedAt && <span className="text-zinc-500"> · reversé</span>}
              {p.failureReason && <em className="block text-zinc-500">{p.failureReason}</em>}
            </li>
          ))}</ul>
        )}
      </section>
    </div>
  );
}
