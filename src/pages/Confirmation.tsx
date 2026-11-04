import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';

const METHOD: Record<string, string> = { ORANGE: 'Orange Money', MTN: 'MTN MoMo', MOOV: 'Moov Money', WAVE: 'Wave' };

/** Confirmation et reçu d'une réservation (imprimable). Se met à jour tant que le paiement est en cours. */
export function Confirmation() {
  const { id = '' } = useParams();
  const [track, setTrack] = useState(false);
  const q = useQuery({
    queryKey: ['booking', id],
    queryFn: () => unwrap(api.bookings[':id'].$get({ param: { id } })),
    refetchInterval: (query) => (query.state.data?.booking.status === 'pending_payment' ? 5000 : false),
  });
  if (q.isLoading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (q.error || !q.data) return <div className="mx-auto max-w-md space-y-3 text-center"><Err e={q.error} /><Link className="btn" to="/account">Mes réservations</Link></div>;
  const b = q.data.booking;
  const confirmed = b.status === 'confirmed';
  const pending = b.status === 'pending_payment';
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className={`rounded-2xl px-5 py-6 text-center ${confirmed ? 'bg-emerald-500/10' : pending ? 'bg-amber-500/10' : 'bg-white/5'}`}>
        <p className={`text-xl font-bold ${confirmed ? 'text-emerald-300' : pending ? 'text-amber-300' : 'text-zinc-300'}`}>
          {confirmed ? '✓ Réservation confirmée' : pending ? 'Paiement en attente' : 'Réservation annulée'}
        </p>
        <p className="mt-2 text-sm text-zinc-400">Numéro de réservation</p>
        <p className="font-mono text-3xl font-extrabold tracking-wider" aria-label="Numéro de réservation">{b.reference}</p>
        {confirmed && <p className="mt-2 text-sm text-zinc-400">Présentez ce numéro au prestataire. Un e-mail de confirmation est envoyé à {b.contactEmail ?? 'votre adresse'} lorsque le service d'e-mails est actif.</p>}
        {pending && <div className="mt-3 print:hidden"><button className="btn" onClick={() => setTrack(true)}>Suivre le paiement</button></div>}
      </div>

      <section className="card space-y-4">
        <h1 className="text-lg font-bold">{b.offerTitle}</h1>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Item k="Prestataire" v={b.companyName} />
          <Item k="Contact prestataire" v={b.companyPhone} />
          <Item k="Date et heure" v={dateFr(b.startsAt)} />
          <Item k="Lieu" v={`${b.city ? `${b.city} → ` : ''}${countryName(b.country)}`} />
          {b.stop && <Item k="Arrêt / rendez-vous" v={b.stop} />}
          {b.companyAddress && <Item k="Adresse" v={b.companyAddress} />}
          <Item k="Places" v={String(b.seats)} />
          <Item k="Réservé le" v={dateFr(b.createdAt)} />
        </dl>
        <hr className="border-white/10" />
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Item k="Réservant" v={b.contactName ?? '—'} />
          <Item k="Téléphone" v={b.contactPhone ?? '—'} />
          <Item k="E-mail" v={b.contactEmail ?? '—'} />
          {b.guests.length > 0 && <Item k="Passagers / participants" v={b.guests.join(', ')} />}
          {b.note && <Item k="Demande particulière" v={b.note} />}
        </dl>
        <hr className="border-white/10" />
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="text-zinc-400">{b.payment ? `Payé par ${METHOD[b.payment.operator] ?? b.payment.operator} (${b.payment.account})` : 'Offre gratuite'}{b.payment?.paidAt ? ` · ${dateFr(b.payment.paidAt)}` : ''}</span>
          <span className="text-xl font-bold">{b.payment ? fcfa(b.payment.amountFcfa) : 'Gratuit'}</span>
        </div>
      </section>

      <div className="flex flex-wrap justify-center gap-3 print:hidden">
        {confirmed && <button className="btn" onClick={() => window.print()}>Imprimer / enregistrer le reçu</button>}
        <Link className="btn-ghost" to="/account">Mes réservations</Link>
        <Link className="btn-ghost" to="/">Continuer mes recherches</Link>
      </div>
      {track && b.payment && <PaymentPanel paymentId={b.payment.id} onClose={() => { setTrack(false); q.refetch(); }} />}
    </div>
  );
}

const Item = ({ k, v }: { k: string; v: string }) => <div><dt className="text-xs text-zinc-500">{k}</dt><dd className="font-medium">{v}</dd></div>;
