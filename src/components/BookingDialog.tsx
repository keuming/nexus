import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { countryName } from '../../shared/geo';
import { Err } from './Layout';
import { PaymentPanel } from './PaymentPanel';

const OPERATORS = [['ORANGE', 'Orange Money'], ['MTN', 'MTN MoMo'], ['MOOV', 'Moov Money'], ['WAVE', 'Wave']] as const;

export interface OfferView {
  id: string; title: string; description: string; priceFcfa: number; startsAt: string; remaining: number;
  country: string; city: string; stops: string[]; companyName: string; activity: string; photoCount: number;
}

export function BookingDialog({ offer, onClose }: { offer: OfferView; onClose: () => void }) {
  const [stop, setStop] = useState('');
  const [seats, setSeats] = useState(1);
  const qc = useQueryClient();
  const nav = useNavigate();
  const [operator, setOperator] = useState<(typeof OPERATORS)[number][0]>('ORANGE');
  const [account, setAccount] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const paid = offer.priceFcfa > 0;
  const [shot, setShot] = useState(0);
  const needsStop = offer.stops.length > 0;
  const m = useMutation({
    mutationFn: () => unwrap(api.bookings.$post({ json: { offerId: offer.id, seats, ...(needsStop ? { stop } : {}), ...(paid ? { payment: { operator, accountNumber: account } } : {}) } })),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      if (r.payment) setPaymentId(r.payment.id); else { onClose(); nav('/account'); }
    },
  });
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <form role="dialog" aria-modal="true" aria-label="Réserver" className="card w-full max-w-md space-y-4"
        onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
        {offer.photoCount > 0 && (
          <div className="space-y-2">
            <img src={`/api/offers/${offer.id}/photos/${shot}`} alt={`${offer.title} — photo ${shot + 1}`} className="aspect-[16/10] w-full rounded-lg object-cover" />
            {offer.photoCount > 1 && (
              <div className="flex gap-2">
                {Array.from({ length: offer.photoCount }, (_, i) => (
                  <button type="button" key={i} aria-label={`Voir la photo ${i + 1}`} onClick={() => setShot(i)} className={`h-12 w-12 overflow-hidden rounded-md border ${shot === i ? 'border-brand' : 'border-white/15'}`}>
                    <img src={`/api/offers/${offer.id}/photos/${i}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <header>
          <h2 className="text-lg font-bold">{offer.title}</h2>
          <p className="text-sm text-zinc-400">{offer.companyName}</p>
        </header>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-zinc-500">Départ / service</dt><dd>{offer.city || '—'}</dd>
          <dt className="text-zinc-500">Pays</dt><dd>{countryName(offer.country)}</dd>
          <dt className="text-zinc-500">Date</dt><dd>{dateFr(offer.startsAt)}</dd>
          <dt className="text-zinc-500">Prix</dt><dd className="font-semibold">{fcfa(offer.priceFcfa)}</dd>
        </dl>
        {needsStop && (
          <div className="space-y-1">
            <label htmlFor="stop" className="text-sm font-medium">Arrêt / lieu de destination</label>
            <select id="stop" className="input" required value={stop} onChange={(e) => setStop(e.target.value)}>
              <option value="">Choisir un arrêt…</option>
              {offer.stops.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        <div className="space-y-1">
          <label htmlFor="seats" className="text-sm font-medium">Nombre de places</label>
          <input id="seats" className="input" type="number" min={1} max={Math.min(20, offer.remaining)} value={seats} onChange={(e) => setSeats(Number(e.target.value))} />
        </div>
        {paid && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Payer avec Mobile Money</legend>
            <div className="grid grid-cols-2 gap-2">
              {OPERATORS.map(([k, label]) => (
                <label key={k} className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm ${operator === k ? 'border-brand bg-brand/10' : 'border-white/15'}`}>
                  <input type="radio" name="op" className="sr-only" checked={operator === k} onChange={() => setOperator(k)} />{label}
                </label>
              ))}
            </div>
            <input className="input" inputMode="tel" autoComplete="tel" required placeholder="Numéro Mobile Money (ex. 0707070707)" value={account} onChange={(e) => setAccount(e.target.value)} aria-label="Numéro Mobile Money" />
          </fieldset>
        )}
        <Err e={m.error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn" disabled={m.isPending || (needsStop && !stop) || (paid && account.replace(/\D/g, '').length < 8)}>{paid ? `Payer ${fcfa(offer.priceFcfa * seats)}` : 'Confirmer'}</button>
        </div>
      </form>
      {paymentId && <PaymentPanel paymentId={paymentId} onClose={() => { onClose(); nav('/account'); }} />}
    </div>
  );
}
