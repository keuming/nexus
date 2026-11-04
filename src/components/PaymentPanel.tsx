import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, fcfa, unwrap } from '../lib/api';
import { Err } from './Layout';

const FINAL = new Set(['paid', 'failed', 'expired', 'needs_refund', 'refunded']);

/** Suivi d'un paiement Mobile Money : interroge le serveur toutes les 4 s (ORZAYAH n'a pas de webhook). */
export function PaymentPanel({ paymentId, onClose, onPaid }: { paymentId: string; onClose: () => void; onPaid?: () => void }) {
  const q = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: () => unwrap(api.payments[':id'].$get({ param: { id: paymentId } })),
    refetchInterval: (query) => (query.state.data && FINAL.has(query.state.data.payment.status) ? false : 4000),
  });
  const p = q.data?.payment;
  useEffect(() => { if (p?.status === 'paid') onPaid?.(); }, [p?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/80 p-4 sm:items-center" onClick={(e) => e.stopPropagation()}>
      <div role="dialog" aria-modal="true" aria-label="Paiement" className="card max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain text-center">
        <Err e={q.error} />
        {!p ? <p className="text-zinc-400">Chargement…</p> : p.status === 'pending' ? (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden />
            <h2 className="text-lg font-bold">Confirmez sur votre téléphone</h2>
            <p className="text-sm text-zinc-300">{p.nextAction?.message ?? `Validez le paiement de ${fcfa(p.amountFcfa)} avec ${p.operator} (${p.account}).`}</p>
            {p.nextAction?.url && /^https:\/\//.test(p.nextAction.url) && <a className="btn inline-block" href={p.nextAction.url} target="_blank" rel="noopener noreferrer">Ouvrir la page de validation</a>}
            <p className="text-xs text-zinc-500">Cette page se met à jour automatiquement. Vos places sont réservées jusqu'à {new Date(p.expiresAt).toLocaleTimeString('fr-FR', { timeStyle: 'short' })}.</p>
          </>
        ) : p.status === 'paid' ? (
          <>
            <h2 className="text-lg font-bold text-emerald-400">Paiement reçu ✓</h2>
            <p className="text-sm text-zinc-300">Votre réservation est confirmée ({fcfa(p.amountFcfa)}).</p>
          </>
        ) : p.status === 'needs_refund' ? (
          <>
            <h2 className="text-lg font-bold text-amber-400">Remboursement en cours</h2>
            <p className="text-sm text-zinc-300">Votre paiement est arrivé après l'expiration de la réservation et les places ne sont plus disponibles. Vous serez remboursé.</p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-red-400">{p.status === 'expired' ? 'Délai dépassé' : p.status === 'refunded' ? 'Paiement remboursé' : 'Paiement non abouti'}</h2>
            <p className="text-sm text-zinc-300">{p.failureReason ?? 'Aucun montant n\'a été débité. Vous pouvez réessayer.'}</p>
          </>
        )}
        <button className="btn-ghost" onClick={onClose}>{p && p.status === 'pending' ? 'Fermer (le paiement continue)' : 'Fermer'}</button>
      </div>
    </div>
  );
}
