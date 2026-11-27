import { placeLabel } from '../lib/place';
import { FULFILLMENT_LABEL, type Fulfillment } from '../../shared/orders';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useState } from 'react';
import { Err } from '../components/Layout';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';
import { useT } from '../lib/i18n';

function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const m = useMutation({ mutationFn: () => unwrap(api.reviews.$post({ json: { bookingId, rating, comment } })), onSuccess: onDone });
  return (
    <form className="mt-2 space-y-2 rounded-lg bg-white/5 p-3" onSubmit={(e) => { e.preventDefault(); if (rating) m.mutate(); }}>
      <div role="radiogroup" aria-label="Note" className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} className={n <= rating ? 'text-amber-400' : 'text-zinc-600'} onClick={() => setRating(n)}>★</button>)}
      </div>
      <textarea className="input" rows={2} maxLength={600} placeholder={t('Votre avis (facultatif)')} value={comment} onChange={(e) => setComment(e.target.value)} />
      <Err e={m.error} />
      <button className="btn" disabled={!rating || m.isPending}>{t('Publier mon avis')}</button>
    </form>
  );
}

export function Account() {
  const t = useT();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['my-bookings'], queryFn: () => unwrap(api.bookings.mine.$get()) });
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => unwrap(api.bookings[':id'].cancel.$post({ param: { id } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-center text-2xl font-bold">{t('Mes réservations')}</h1>
      <Err e={q.error ?? cancel.error} />
      {q.isLoading ? <p className="text-zinc-400">{t('Chargement…')}</p> : !q.data?.bookings.length ? <p className="text-zinc-400">{t('Aucune réservation.')}</p> : (
        <ul className="space-y-3">
          {q.data.bookings.map((b) => (
            <li key={b.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{b.offerTitle} <span className="ml-1 font-mono text-xs text-zinc-500">{b.reference}</span></p>
                <p className="text-sm text-zinc-400">{b.companyName} · {placeLabel(b)}{b.stop ? ` · arrêt : ${b.stop}` : ''}</p>
                {b.status === 'confirmed' && b.fulfillment !== 'new' && <p className="text-sm font-medium text-emerald-300">{FULFILLMENT_LABEL[b.fulfillment as Fulfillment] ?? b.fulfillment}</p>}
                {b.status === 'cancelled' && b.cancelledBy === 'merchant' && <p className="text-sm text-red-300">Annulée par le prestataire{b.cancelReason ? ` : ${b.cancelReason}` : ''}</p>}
                <p className="text-sm text-zinc-500">{b.seats} place(s){b.payMethod === 'cash' && b.priceFcfa > 0 ? ` · ${fcfa(b.priceFcfa * b.seats)} à payer à la livraison` : ''} · <Link className="underline" to={`/reservation/${b.id}`}>{t('Voir le reçu')}</Link></p>
                {b.status === 'confirmed' && b.fulfillment === 'completed' && (b.myRating
                  ? <p className="text-sm text-amber-400" aria-label={`Votre note : ${b.myRating} sur 5`}>{'★'.repeat(b.myRating)} <span className="text-zinc-500">{t('Merci pour votre avis')}</span></p>
                  : reviewing === b.id
                    ? <ReviewForm bookingId={b.id} onDone={() => { setReviewing(null); qc.invalidateQueries({ queryKey: ['my-bookings'] }); qc.invalidateQueries({ queryKey: ['offer-reviews'] }); }} />
                    : <button type="button" className="mt-1 text-sm text-brand hover:underline" onClick={() => setReviewing(b.id)}>{t('★ Laisser un avis')}</button>)}
              </div>
              {b.status === 'pending_payment' && b.creditLockUntil
                ? <span className="text-sm text-amber-300">{t('Commande en cours d’attribution')}</span>
                : b.status === 'pending_payment' && b.paymentId
                ? <button className="btn" onClick={() => setPaying(b.paymentId!)}>{t('Suivre le paiement')}</button>
                : b.status === 'confirmed'
                  ? b.paymentStatus
                    ? <span className="text-sm text-emerald-400">{t('Payée')}</span>
                    : ['new', 'accepted'].includes(b.fulfillment)
                      ? <button className="btn-ghost" disabled={cancel.isPending} onClick={() => confirm(t('Annuler cette réservation ?')) && cancel.mutate(b.id)}>{t('Annuler')}</button>
                      : <span className="text-sm text-zinc-500">{b.fulfillment === 'completed' ? t('Livrée') : t('En préparation')}</span>
                  : <span className="text-sm text-zinc-500">{b.paymentStatus === 'needs_refund' ? t('Remboursement en cours') : t('Annulée')}</span>}
            </li>
          ))}
        </ul>
      )}
      {paying && <PaymentPanel paymentId={paying} onClose={() => { setPaying(null); qc.invalidateQueries({ queryKey: ['my-bookings'] }); }} />}
    </div>
  );
}
