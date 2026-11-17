import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from './Layout';
import { CANCEL_REASONS, FULFILLMENT_LABEL, type Fulfillment } from '../../shared/orders';

export interface OrderRow {
  id: string; reference: string; seats: number; stop: string | null; status: string; createdAt: string; updatedAt: string;
  offerTitle: string; customerName: string; contactPhone: string | null; contactEmail: string | null; guests: string[]; note: string;
  paymentStatus: string | null; amountFcfa: number | null; payMethod: string; dueFcfa: number;
  fulfillment: string; merchantNote: string; cancelReason: string | null; cancelledBy: string | null; cashCollectedAt: string | null;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: 'Paiement en attente', cls: 'bg-amber-500/15 text-amber-300' },
  cancelled: { label: 'Annulée', cls: 'bg-white/10 text-zinc-400' },
};
const STEP_CLS: Record<string, string> = {
  new: 'bg-sky-500/15 text-sky-300', accepted: 'bg-indigo-500/15 text-indigo-300', preparing: 'bg-amber-500/15 text-amber-300',
  ready: 'bg-emerald-500/15 text-emerald-300', completed: 'bg-white/10 text-zinc-300', no_show: 'bg-red-500/15 text-red-300',
};
/** Étape suivante proposée en un clic dans la liste. */
const NEXT: Partial<Record<Fulfillment, { to: Fulfillment; label: string }>> = {
  new: { to: 'accepted', label: 'Accepter' }, accepted: { to: 'preparing', label: 'Préparer' },
  preparing: { to: 'ready', label: 'Prête' }, ready: { to: 'completed', label: 'Livrée' },
};
const STEPS: Fulfillment[] = ['new', 'accepted', 'preparing', 'ready', 'completed', 'no_show'];

const toCollect = (b: OrderRow) => b.status === 'confirmed' && b.payMethod === 'cash' && b.dueFcfa > 0 && !b.cashCollectedAt && b.fulfillment !== 'no_show';
const FILTERS: { id: string; label: string; test: (b: OrderRow) => boolean }[] = [
  { id: 'all', label: 'Toutes', test: () => true },
  { id: 'new', label: 'À traiter', test: (b) => b.status === 'confirmed' && b.fulfillment === 'new' },
  { id: 'doing', label: 'En cours', test: (b) => b.status === 'confirmed' && (b.fulfillment === 'accepted' || b.fulfillment === 'preparing') },
  { id: 'ready', label: 'Prêtes', test: (b) => b.status === 'confirmed' && b.fulfillment === 'ready' },
  { id: 'done', label: 'Livrées', test: (b) => b.status === 'confirmed' && b.fulfillment === 'completed' },
  { id: 'cash', label: 'À encaisser', test: toCollect },
  { id: 'wait', label: 'Paiement en attente', test: (b) => b.status === 'pending_payment' || toCollect(b) },
  { id: 'cancelled', label: 'Annulées / absents', test: (b) => b.status === 'cancelled' || b.fulfillment === 'no_show' },
];

const ago = (d: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000));
  return m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : `il y a ${Math.round(m / 1440)} j`;
};
const digits = (p: string | null) => (p ?? '').replace(/\D/g, '');
const html = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function exportCsv(rows: OrderRow[]) {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Référence', 'Date', 'Client', 'Téléphone', 'E-mail', 'Offre', 'Places', 'Montant (FCFA)', 'Paiement', 'Encaissé', 'Statut', 'Étape', 'Note interne'];
  const lines = rows.map((b) => [b.reference, dateFr(b.createdAt), b.customerName, b.contactPhone, b.contactEmail, b.offerTitle, b.seats,
    b.amountFcfa ?? b.dueFcfa, b.payMethod === 'cash' ? 'À la livraison' : 'En ligne', b.cashCollectedAt ? 'Oui' : b.payMethod === 'cash' ? 'Non' : '',
    (STATUS[b.status]?.label ?? 'Confirmée'), FULFILLMENT_LABEL[b.fulfillment as Fulfillment] ?? b.fulfillment, b.merchantNote].map(cell).join(';'));
  const blob = new Blob(['﻿' + [head.map(cell).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `commandes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function printSlip(b: OrderRow) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) return;
  const due = b.payMethod === 'cash' && b.dueFcfa > 0 ? `À encaisser à la livraison : ${fcfa(b.dueFcfa)}` : b.amountFcfa ? `Payé en ligne : ${fcfa(b.amountFcfa)}` : 'Gratuit';
  w.document.write(`<!doctype html><meta charset="utf-8"><title>Bon ${html(b.reference)}</title><body style="font-family:Arial,sans-serif;max-width:640px;margin:24px auto;color:#111">
<h1 style="margin:0">Bon de commande ${html(b.reference)}</h1><p style="color:#555">${html(dateFr(b.createdAt))}</p><hr>
<p><b>${html(b.offerTitle)}</b> — ${b.seats} place(s)${b.stop ? ` — arrêt : ${html(b.stop)}` : ''}</p>
<p><b>Client :</b> ${html(b.customerName)}<br>${html(b.contactPhone ?? '')}<br>${html(b.contactEmail ?? '')}</p>
${b.guests.length ? `<p><b>Participants :</b> ${html(b.guests.join(', '))}</p>` : ''}
${b.note ? `<p><b>Demande du client :</b> ${html(b.note)}</p>` : ''}
<p style="font-size:18px"><b>${html(due)}</b></p><p>Étape : ${html(FULFILLMENT_LABEL[b.fulfillment as Fulfillment] ?? b.fulfillment)}</p>
<script>window.onload=()=>window.print()</script></body>`);
  w.document.close();
}

/** Gestion des commandes du fournisseur : suivi d'étape, encaissement, contact client, notes, annulation, export. */
export function CompanyOrders({ q }: { q: UseQueryResult<{ bookings: OrderRow[] }, Error> }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: ['company-bookings'] }); qc.invalidateQueries({ queryKey: ['company'] }); };
  const all = q.data?.bookings ?? [];
  const count = (id: string) => all.filter(FILTERS.find((f) => f.id === id)!.test).length;
  const rows = useMemo(() => {
    const t = FILTERS.find((f) => f.id === filter)!.test;
    const s = search.trim().toLowerCase();
    const sd = digits(search);
    return all.filter(t).filter((b) => !s || b.reference.toLowerCase().includes(s) || b.customerName.toLowerCase().includes(s) || b.offerTitle.toLowerCase().includes(s) || (sd.length >= 3 && digits(b.contactPhone).includes(sd)));
  }, [all, filter, search]);

  const step = useMutation({
    mutationFn: (v: { id: string; fulfillment: Fulfillment }) => unwrap(api.company.bookings[':id'].status.$post({ param: { id: v.id }, json: { fulfillment: v.fulfillment } })),
    onSuccess: refresh,
  });
  const open = all.find((b) => b.id === openId) ?? null;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[['new', 'À traiter', 'text-sky-300'], ['doing', 'En cours', 'text-amber-300'], ['ready', 'Prêtes', 'text-emerald-300'], ['cash', 'À encaisser', 'text-brand'], ['done', 'Livrées', 'text-zinc-300']].map(([id, label, cls]) => (
          <button key={id} type="button" onClick={() => setFilter(id)} className={`card !p-3 text-left transition hover:border-white/25 ${filter === id ? 'border-brand' : ''}`}>
            <span className="block text-xs text-zinc-400">{label}</span><span className={`text-2xl font-bold ${cls}`}>{count(id)}</span>{id === 'cash' && count('cash') > 0 && <span className="block text-xs text-zinc-400">{fcfa(all.filter(toCollect).reduce((n, b) => n + b.dueFcfa, 0))}</span>}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input className="input max-w-xs" type="search" placeholder="Rechercher : référence, client, téléphone, offre…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher une commande" />
        <button className="btn-ghost ml-auto" disabled={!rows.length} onClick={() => exportCsv(rows)}>Exporter (CSV)</button>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les commandes">
        {FILTERS.map((x) => (
          <button key={x.id} aria-pressed={filter === x.id} onClick={() => setFilter(x.id)}
            className={`rounded-full border px-3 py-1 text-xs ${filter === x.id ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{x.label} ({count(x.id)})</button>
        ))}
      </div>

      <Err e={q.error ?? step.error} />
      {q.isLoading ? <p className="text-zinc-400">Chargement…</p> : !rows.length ? (
        <p className="card text-center text-sm text-zinc-400">{search || filter !== 'all' ? 'Aucune commande ne correspond.' : 'Aucune réservation pour le moment.'}</p>
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
              <tr><th className="px-4 py-3 font-medium">Commande</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Offre</th><th className="px-4 py-3 font-medium">Montant</th><th className="px-4 py-3 font-medium">Étape</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((b) => {
                const confirmed = b.status === 'confirmed';
                const f = b.fulfillment as Fulfillment;
                const nx = confirmed ? NEXT[f] : undefined;
                const st = confirmed ? { label: FULFILLMENT_LABEL[f] ?? f, cls: STEP_CLS[f] ?? 'bg-white/10' } : (STATUS[b.status] ?? { label: b.status, cls: 'bg-white/10' });
                return (
                  <tr key={b.id} className={confirmed && f === 'new' ? 'bg-sky-500/5' : ''}>
                    <td className="whitespace-nowrap px-4 py-3"><span className="font-mono text-xs">{b.reference}</span><span className="block text-xs text-zinc-500">{ago(b.createdAt)}</span></td>
                    <td className="px-4 py-3 font-medium">{b.customerName}{b.contactPhone && <span className="block text-xs font-normal text-zinc-400">{b.contactPhone}</span>}</td>
                    <td className="px-4 py-3">{b.offerTitle} <span className="text-zinc-500">× {b.seats}</span>{b.stop && <span className="block text-xs text-zinc-500">Arrêt : {b.stop}</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3">{b.amountFcfa ? <>{fcfa(b.amountFcfa)}<span className="block text-xs text-emerald-300">Payé en ligne</span></> : b.payMethod === 'cash' && b.dueFcfa > 0 ? <>{fcfa(b.dueFcfa)}{b.status === 'confirmed' && <span className={`block text-xs ${b.cashCollectedAt ? 'text-emerald-300' : 'text-amber-300'}`}>{b.cashCollectedAt ? 'Encaissé' : 'À encaisser'}</span>}</> : <span className="text-zinc-400">Gratuit</span>}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {nx && <button className="btn !px-3 !py-1.5" disabled={step.isPending} onClick={() => step.mutate({ id: b.id, fulfillment: nx.to })}>{nx.label}</button>}
                      <button className="btn-ghost ml-2 !px-3 !py-1.5" onClick={() => setOpenId(b.id)}>Détails</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {open && <OrderDetail b={open} onClose={() => setOpenId(null)} onChanged={refresh} />}
    </section>
  );
}

function OrderDetail({ b, onClose, onChanged }: { b: OrderRow; onClose: () => void; onChanged: () => void }) {
  const [note, setNote] = useState(b.merchantNote);
  const [reason, setReason] = useState('');
  const [other, setOther] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const done = () => onChanged();
  const step = useMutation({ mutationFn: (fulfillment: Fulfillment) => unwrap(api.company.bookings[':id'].status.$post({ param: { id: b.id }, json: { fulfillment } })), onSuccess: done });
  const cash = useMutation({ mutationFn: (collected: boolean) => unwrap(api.company.bookings[':id'].cash.$post({ param: { id: b.id }, json: { collected } })), onSuccess: done });
  const saveNote = useMutation({ mutationFn: () => unwrap(api.company.bookings[':id'].note.$patch({ param: { id: b.id }, json: { note } })), onSuccess: done });
  const cancel = useMutation({
    mutationFn: () => unwrap(api.company.bookings[':id'].cancel.$post({ param: { id: b.id }, json: { reason: reason === 'Autre' ? other : reason } })),
    onSuccess: () => { done(); onClose(); },
  });
  const confirmed = b.status === 'confirmed';
  const f = b.fulfillment as Fulfillment;
  const phone = digits(b.contactPhone);
  const wa = `https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${b.customerName}, concernant votre réservation ${b.reference} (${b.offerTitle}) sur BackMarket : `)}`;
  const busy = step.isPending || cash.isPending;
  const reasonOk = reason && (reason !== 'Autre' || other.trim().length >= 3);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={`Commande ${b.reference}`} className="card max-h-[calc(100dvh-1.5rem)] w-full max-w-xl space-y-4 overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold">{b.offerTitle} <span className="font-mono text-sm text-zinc-400">× {b.seats}</span></h2><p className="font-mono text-xs text-zinc-400">{b.reference} · {dateFr(b.createdAt)}</p></div>
          <button className="text-2xl leading-none text-zinc-400 hover:text-white" aria-label="Fermer" onClick={onClose}>×</button>
        </div>
        <Err e={step.error ?? cash.error ?? saveNote.error ?? cancel.error} />

        <div className="space-y-1 rounded-lg bg-white/5 p-3 text-sm">
          <p className="font-medium">{b.customerName}</p>
          {b.contactPhone && <p className="text-zinc-300">{b.contactPhone}</p>}
          {b.contactEmail && <p className="text-zinc-300">{b.contactEmail}</p>}
          {b.guests.length > 0 && <p className="text-zinc-400">Participants : {b.guests.join(', ')}</p>}
          {b.stop && <p className="text-zinc-400">Arrêt : {b.stop}</p>}
          {b.note && <p className="text-amber-300">Demande du client : {b.note}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {b.contactPhone && <a className="btn-ghost !px-3 !py-1.5" href={`tel:${b.contactPhone.replace(/\s/g, '')}`}>Appeler</a>}
            {phone.length >= 8 && <a className="btn-ghost !px-3 !py-1.5" href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
            {b.contactEmail && <a className="btn-ghost !px-3 !py-1.5" href={`mailto:${b.contactEmail}?subject=${encodeURIComponent(`Votre réservation ${b.reference}`)}`}>E-mail</a>}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">{b.amountFcfa ? 'Payé en ligne' : b.payMethod === 'cash' && b.dueFcfa > 0 ? 'Paiement à la livraison' : 'Offre gratuite'}</span>
          <span className="text-lg font-bold">{b.amountFcfa ? fcfa(b.amountFcfa) : b.dueFcfa > 0 ? fcfa(b.dueFcfa) : 'Gratuit'}</span>
        </div>
        {confirmed && b.payMethod === 'cash' && b.dueFcfa > 0 && (
          <button className={b.cashCollectedAt ? 'btn-ghost w-full' : 'btn w-full'} disabled={busy} onClick={() => cash.mutate(!b.cashCollectedAt)}>
            {b.cashCollectedAt ? `Encaissé le ${dateFr(b.cashCollectedAt)} · Annuler la mention` : `Marquer comme encaissé (${fcfa(b.dueFcfa)})`}
          </button>
        )}

        {confirmed ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Étape de la commande <span className="text-xs font-normal text-zinc-500">(le client est prévenu à « Acceptée » et « Prête »)</span></p>
            <div className="flex flex-wrap gap-1.5">
              {STEPS.map((s) => (
                <button key={s} disabled={busy || s === f} aria-pressed={s === f} onClick={() => step.mutate(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${s === f ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{FULFILLMENT_LABEL[s]}</button>
              ))}
            </div>
          </div>
        ) : b.status === 'cancelled' ? (
          <p className="rounded-lg bg-white/5 px-3 py-2 text-sm text-zinc-300">Annulée {b.cancelledBy === 'merchant' ? 'par vous' : 'par le client'}{b.cancelReason ? ` · ${b.cancelReason}` : ''}.{b.paymentStatus === 'needs_refund' ? ' Le client a payé en ligne : à rembourser depuis votre compte ORZAYAH.' : ''}</p>
        ) : <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">Paiement en attente : la commande sera actionnable dès que le client aura payé.</p>}

        <div className="space-y-2">
          <label htmlFor="o-note" className="text-sm font-medium">Note interne <span className="text-xs font-normal text-zinc-500">(visible par vous seul)</span></label>
          <textarea id="o-note" className="input min-h-16" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. client rappelé, livraison prévue demain 10 h…" />
          <button className="btn-ghost" disabled={saveNote.isPending || note.trim() === b.merchantNote} onClick={() => saveNote.mutate()}>{saveNote.isSuccess && note.trim() === b.merchantNote ? 'Note enregistrée ✓' : 'Enregistrer la note'}</button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <button className="btn-ghost" onClick={() => printSlip(b)}>Imprimer le bon</button>
          {confirmed && !cancelling && f !== 'completed' && !b.cashCollectedAt && <button className="rounded-lg border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10" onClick={() => setCancelling(true)}>Annuler la réservation</button>}
        </div>
        {confirmed && cancelling && (
          <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
            <p className="text-sm font-medium text-red-300">Motif de l'annulation (le client sera prévenu)</p>
            <select className="input" aria-label="Motif" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Choisir un motif…</option>
              {CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            {reason === 'Autre' && <input className="input" maxLength={150} placeholder="Précisez le motif" value={other} onChange={(e) => setOther(e.target.value)} />}
            {b.paymentStatus === 'paid' && <p className="text-xs text-amber-300">Le client a déjà payé en ligne sur votre compte ORZAYAH : vous devrez le rembourser vous-même depuis ORZAYAH.</p>}
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setCancelling(false)}>Retour</button>
              <button className="btn !bg-red-500 !text-white" disabled={!reasonOk || cancel.isPending} onClick={() => cancel.mutate()}>Confirmer l'annulation</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
