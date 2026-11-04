import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../lib/api';
import { useState } from 'react';
import { Err } from '../components/Layout';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';

export function Account() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['my-bookings'], queryFn: () => unwrap(api.bookings.mine.$get()) });
  const [paying, setPaying] = useState<string | null>(null);
  const cancel = useMutation({
    mutationFn: (id: string) => unwrap(api.bookings[':id'].cancel.$post({ param: { id } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-bookings'] }),
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-center text-2xl font-bold">Mes réservations</h1>
      <Err e={q.error ?? cancel.error} />
      {q.isLoading ? <p className="text-zinc-400">Chargement…</p> : !q.data?.bookings.length ? <p className="text-zinc-400">Aucune réservation.</p> : (
        <ul className="space-y-3">
          {q.data.bookings.map((b) => (
            <li key={b.id} className="card flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">{b.offerTitle}</p>
                <p className="text-sm text-zinc-400">{b.companyName} · {b.city ? `${b.city} → ` : ''}{countryName(b.country)}{b.stop ? ` · arrêt : ${b.stop}` : ''}</p>
                <p className="text-sm text-zinc-500">{dateFr(b.startsAt)} · {b.seats} place(s)</p>
              </div>
              {b.status === 'pending_payment' && b.paymentId
                ? <button className="btn" onClick={() => setPaying(b.paymentId!)}>Suivre le paiement</button>
                : b.status === 'confirmed'
                  ? b.paymentStatus
                    ? <span className="text-sm text-emerald-400">Payée</span>
                    : <button className="btn-ghost" disabled={cancel.isPending} onClick={() => confirm('Annuler cette réservation ?') && cancel.mutate(b.id)}>Annuler</button>
                  : <span className="text-sm text-zinc-500">{b.paymentStatus === 'needs_refund' ? 'Remboursement en cours' : 'Annulée'}</span>}
            </li>
          ))}
        </ul>
      )}
      {paying && <PaymentPanel paymentId={paying} onClose={() => { setPaying(null); qc.invalidateQueries({ queryKey: ['my-bookings'] }); }} />}
    </div>
  );
}
