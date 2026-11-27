import { placeLabel } from '../lib/place';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';


/** Confirmation et reçu d'une réservation (imprimable). Se met à jour tant que le paiement est en cours. */
export function Confirmation() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [track, setTrack] = useState(false);
  const cancelLocked = useMutation({ mutationFn: () => unwrap(api.bookings[':id'].cancel.$post({ param: { id } })), onSuccess: () => { q.refetch(); } });
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
  const locked = pending && !!b.creditLockUntil;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className={`rounded-2xl px-5 py-6 text-center ${confirmed ? 'bg-emerald-500/10' : pending ? 'bg-amber-500/10' : 'bg-white/5'}`}>
        <p className={`text-xl font-bold ${confirmed ? 'text-emerald-300' : pending ? 'text-amber-300' : 'text-zinc-300'}`}>
          {confirmed ? (b.fulfillment === 'ready' ? '✓ Votre commande est prête' : b.fulfillment === 'completed' ? '✓ Commande livrée' : b.fulfillment === 'accepted' || b.fulfillment === 'preparing' ? '✓ Réservation acceptée par le prestataire' : '✓ Réservation confirmée') : locked ? 'Commande en cours d’attribution' : pending ? 'Paiement en attente' : b.cancelledBy === 'merchant' ? 'Réservation annulée par le prestataire' : 'Réservation annulée'}
        </p>
        <p className="mt-2 text-sm text-zinc-400">Numéro de réservation</p>
        <p className="font-mono text-3xl font-extrabold tracking-wider" aria-label="Numéro de réservation">{b.reference}</p>
        {confirmed && <p className="mt-2 text-sm text-zinc-400">Présentez ce numéro au prestataire. Un e-mail de confirmation est envoyé à {b.contactEmail ?? 'votre adresse'} lorsque le service d'e-mails est actif.</p>}
        {!confirmed && !pending && b.cancelReason && b.cancelledBy === 'merchant' && <p className="mt-2 text-sm text-zinc-300">Motif : {b.cancelReason}</p>}
        {locked && <div className="mt-3 space-y-3 print:hidden">
          <p className="text-sm text-zinc-300">Votre commande est enregistrée et <strong>vous n'avez rien à payer pour l'instant</strong>. Le prestataire doit la valider ; s'il ne le fait pas dans l'heure, nous la confions automatiquement à un autre prestataire proposant la même offre. Vous serez prévenu(e) et le paiement vous sera demandé une fois la commande attribuée.</p>
          <button className="btn-ghost" disabled={cancelLocked.isPending} onClick={() => confirm('Annuler cette commande ?') && cancelLocked.mutate()}>Annuler ma commande</button>
          <Err e={cancelLocked.error} />
        </div>}
        {pending && !locked && <div className="mt-3 flex flex-wrap justify-center gap-2 print:hidden">
          {b.payment?.payUrl && /^https:\/\//.test(b.payment.payUrl) && <a className="btn" href={b.payment.payUrl}>Payer maintenant</a>}
          <button className="btn-ghost" onClick={() => setTrack(true)}>Suivre le paiement</button>
        </div>}
      </div>

      <section className="card space-y-4">
        <h1 className="text-lg font-bold">{b.offerTitle}</h1>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Item k="Prestataire" v={b.companyName} />
          <Item k="Contact prestataire" v={b.companyPhone} />
          <Item k="Lieu" v={placeLabel(b)} />
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
          <span className="text-zinc-400">{b.payMethod === 'cash' && b.priceFcfa > 0 ? 'Paiement à la livraison : à régler directement au prestataire' : b.payment ? (b.payment.status === 'paid' ? 'Payé en ligne via ORZAYAH' : 'Paiement en ligne ORZAYAH') : 'Offre gratuite'}{b.payment?.paidAt ? ` · ${dateFr(b.payment.paidAt)}` : ''}</span>
          <span className="text-xl font-bold">{b.payment ? fcfa(b.payment.amountFcfa) : b.payMethod === 'cash' && b.priceFcfa > 0 ? fcfa(b.priceFcfa * b.seats) : 'Gratuit'}</span>
        </div>
      </section>

      {user?.guest && <CreateAccount defaultEmail={b.contactEmail ?? ''} />}

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

/** Proposé aux clients « invités » : crée leur compte en gardant leurs réservations. */
function CreateAccount({ defaultEmail }: { defaultEmail: string }) {
  const { refresh } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const m = useMutation({ mutationFn: () => unwrap(api.auth.upgrade.$post({ json: { email, password } })), onSuccess: () => { void refresh(); } });
  return (
    <form className="card space-y-3 print:hidden" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
      <h2 className="font-semibold">Créer mon compte BackMarket (facultatif)</h2>
      <p className="text-sm text-zinc-400">Retrouvez cette réservation et les suivantes dans « Mes réservations », depuis n'importe quel appareil.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label htmlFor="u-email" className="text-sm font-medium">E-mail</label>
          <input id="u-email" type="email" required className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="space-y-1"><label htmlFor="u-pw" className="text-sm font-medium">Mot de passe (8 caractères min.)</label>
          <input id="u-pw" type="password" required minLength={8} className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </div>
      <Err e={m.error} />
      <button className="btn" disabled={m.isPending}>{m.isPending ? 'Création…' : 'Créer mon compte'}</button>
    </form>
  );
}
