import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { placeLabel } from '../lib/place';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, ApiError, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';

type Step = 1 | 2 | 3;
const STEPS = ['Ma sélection', 'Mes informations', 'Paiement', 'Confirmation'];
const NOUN: Record<string, string> = { transport: 'passager', hotel: 'occupant', residence_meuble: 'occupant' };

interface Draft {
  seats: number; stop: string; name: string; phone: string; email: string; guests: string[]; note: string;
  mode: '' | 'cash' | 'digital'; accept: boolean;
  signup: '' | 'create' | 'guest'; password: string;
}
const key = (id: string) => `nx-checkout-${id}`;
const load = (id: string): Partial<Draft> => { try { return JSON.parse(sessionStorage.getItem(key(id)) ?? '{}'); } catch { return {}; } };
const save = (id: string, d: Draft) => { try { sessionStorage.setItem(key(id), JSON.stringify({ ...d, accept: false, password: '' })); } catch { /* stockage indisponible */ } };

/** Parcours de réservation en ligne : sélection → informations du réservant → paiement ORZAYAH → confirmation. */
export function Checkout() {
  const { offerId = '' } = useParams();
  const { user, loading, refresh } = useAuth();
  const nav = useNavigate();
  const offer = useQuery({ queryKey: ['offer', offerId], queryFn: () => unwrap(api.offers[':id'].$get({ param: { id: offerId } })), retry: false });
  const [step, setStep] = useState<Step>(1);
  const [d, setD] = useState<Draft>(() => ({ seats: 1, stop: '', name: '', phone: '', email: '', guests: [], note: '', mode: '', accept: false, signup: '', password: '', ...load(offerId) }));
  const [paying, setPaying] = useState<{ paymentId: string; bookingId: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  // Préremplit avec le compte, sans écraser ce que le client a déjà saisi.
  useEffect(() => { if (user) setD((x) => ({ ...x, name: x.name || user.name, email: x.email || user.email })); }, [user]);
  useEffect(() => { save(offerId, d); }, [offerId, d]);
  const allowCash = offer.data?.offer.allowCash;
  useEffect(() => { if (allowCash === false) setD((x) => (x.mode === 'cash' ? { ...x, mode: '' } : x)); }, [allowCash]);
  const onlineOk = offer.data?.offer.canPayOnline === true;
  useEffect(() => { if (offer.data && !onlineOk) setD((x) => (x.mode === 'digital' ? { ...x, mode: '' } : x)); }, [offer.data, onlineOk]);

  const o = offer.data?.offer;
  const price = o?.priceFcfa ?? 0;
  const total = price * d.seats;
  const paid = total > 0;
  const needsStop = !!o && o.stops.length > 0;
  const isTransport = o?.activity === 'transport';
  const who = NOUN[o?.activity ?? ''] ?? 'participant';
  const maxSeats = Math.max(1, Math.min(20, o?.remaining ?? 1));
  const guests = useMemo(() => Array.from({ length: d.seats }, (_, i) => d.guests[i] ?? ''), [d.guests, d.seats]);

  const book = useMutation({
    mutationFn: async () => {
      // Étape « compte » (facultative) : création du compte, ou session d'invité pour réserver sans inscription.
      if (!user) {
        if (d.signup === 'create') await unwrap(api.auth.register.$post({ json: { email: d.email, name: d.name, password: d.password, role: 'customer' as const } }));
        else await unwrap(api.auth.guest.$post({ json: { name: d.name } }));
        await refresh();
      }
      return unwrap(api.bookings.$post({ json: {
      offerId, seats: d.seats, ...(needsStop ? { stop: d.stop } : {}),
      contact: { name: d.name, phone: d.phone, email: d.email },
      guests: guests.map((g) => g.trim()).filter(Boolean), note: d.note, acceptTerms: true as const,
      ...(paid ? { payMode: d.mode === 'cash' ? 'cash' as const : 'digital' as const } : {}),
    } }));
    },
    onSuccess: (r) => {
      try { sessionStorage.removeItem(key(offerId)); } catch { /* ignore */ }
      // Paiement en ligne : on envoie le client sur la page de paiement hébergée par ORZAYAH (https uniquement).
      if (r.payment?.payUrl && /^https:\/\//.test(r.payment.payUrl)) { window.location.assign(r.payment.payUrl); return; }
      if (r.payment) setPaying({ paymentId: r.payment.id, bookingId: r.booking.id });
      else nav(`/reservation/${r.booking.id}`, { replace: true });
    },
  });

  if (loading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (offer.isLoading) return <p className="text-center text-zinc-400">Chargement de l'offre…</p>;
  if (offer.error || !o) return <div className="mx-auto max-w-md space-y-3 text-center"><Err e={offer.error ?? new Error('Offre introuvable ou indisponible')} /><Link className="btn" to="/">Retour au catalogue</Link></div>;
  if (o.remaining < 1) return <div className="mx-auto max-w-md space-y-3 text-center"><p className="text-zinc-300">Cette offre est complète.</p><Link className="btn" to="/">Retour au catalogue</Link></div>;

  const next = (e: FormEvent, to: Step) => { e.preventDefault(); book.reset(); setStep(to); window.scrollTo({ top: 0 }); };
  const pay = (e: FormEvent) => { e.preventDefault(); book.mutate(); };
  const methodsOk = o.canPayOnline === true; // le marchand a relié son compte ORZAYAH
  const cashOk = o.allowCash !== false;
  const online = paid && d.mode === 'digital';
  const canSubmit = !paid || (d.mode === 'cash' && cashOk) || (d.mode === 'digital' && methodsOk);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div><Link to="/" className="text-sm text-zinc-400 hover:text-white">← Retour au catalogue</Link></div>
      <ol className="flex items-center justify-between gap-2 text-xs sm:text-sm" aria-label="Étapes de la réservation">
        {STEPS.map((s, i) => {
          const n = i + 1; const done = n < step; const cur = n === step;
          return (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={cur ? 'step' : undefined}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${done ? 'border-brand bg-brand text-black' : cur ? 'border-brand text-brand' : 'border-white/20 text-zinc-500'}`}>{done ? '✓' : n}</span>
              <span className={`hidden sm:inline ${cur ? 'font-semibold text-white' : 'text-zinc-500'}`}>{s}</span>
              {n < STEPS.length && <span className="h-px flex-1 bg-white/15" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <p className="text-center text-sm font-semibold sm:hidden">Étape {step} sur 4 · {STEPS[step - 1]}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          {step === 1 && (
            <form onSubmit={(e) => next(e, 2)} className="card space-y-5">
              <h1 className="text-lg font-bold">Ma sélection</h1>
              {needsStop && (
                <div className="space-y-1">
                  <label htmlFor="stop" className="text-sm font-medium">{isTransport ? 'Arrêt / lieu de destination' : 'Lieu / point de rendez-vous'}</label>
                  <select id="stop" className="input" required value={d.stop} onChange={(e) => set('stop', e.target.value)}>
                    <option value="">Choisir…</option>
                    {o.stops.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1">
                <span id="seats-l" className="text-sm font-medium">Nombre de places</span>
                <div className="flex items-center gap-3" role="group" aria-labelledby="seats-l">
                  <button type="button" className="btn-ghost !px-3" aria-label="Retirer une place" disabled={d.seats <= 1} onClick={() => set('seats', d.seats - 1)}>−</button>
                  <output className="w-8 text-center text-lg font-bold" aria-live="polite">{d.seats}</output>
                  <button type="button" className="btn-ghost !px-3" aria-label="Ajouter une place" disabled={d.seats >= maxSeats} onClick={() => set('seats', d.seats + 1)}>+</button>
                  <span className="text-xs text-zinc-500">{o.remaining} place(s) restante(s)</span>
                </div>
              </div>
              <div className="flex justify-end"><button className="btn">Continuer</button></div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={(e) => next(e, 3)} className="card space-y-4">
              <h1 className="text-lg font-bold">Mes informations</h1>
              <p className="text-sm text-zinc-400">Ces informations sont transmises au prestataire pour confirmer et honorer votre réservation.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="c-name" label="Nom complet *"><input id="c-name" className="input" required minLength={2} maxLength={100} autoComplete="name" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
                <Field id="c-phone" label="Téléphone *"><input id="c-phone" className="input" type="tel" required autoComplete="tel" placeholder="+225 07 00 00 00 00" pattern="^\+?[0-9 ().\-]{8,20}$" value={d.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                <Field id="c-email" label="E-mail *" cls="sm:col-span-2"><input id="c-email" className="input" type="email" required autoComplete="email" value={d.email} onChange={(e) => set('email', e.target.value)} /></Field>
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{isTransport ? 'Passagers' : `Noms des ${who}s`} {isTransport ? '*' : '(facultatif)'}</legend>
                {guests.map((g, i) => (
                  <input key={i} className="input" required={isTransport} minLength={2} maxLength={100} aria-label={`${who} ${i + 1}`} placeholder={`${who[0].toUpperCase()}${who.slice(1)} ${i + 1} — nom complet`}
                    value={g} onChange={(e) => { const arr = [...guests]; arr[i] = e.target.value; set('guests', arr); }} />
                ))}
                {isTransport && <p className="text-xs text-zinc-500">Le nom doit correspondre à la pièce d'identité présentée à l'embarquement.</p>}
              </fieldset>
              <Field id="c-note" label="Demande particulière (facultatif)"><textarea id="c-note" className="input" maxLength={500} rows={3} value={d.note} onChange={(e) => set('note', e.target.value)} /></Field>
              <div className="flex justify-between gap-2">
                <button type="button" className="btn-ghost" onClick={() => setStep(1)}>Retour</button>
                <button className="btn">Continuer</button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={pay} className="card space-y-5">
              <h1 className="text-lg font-bold">{paid ? 'Paiement' : 'Confirmation'}</h1>
              <div className="space-y-1 rounded-lg bg-white/5 px-3 py-2 text-sm">
                <p><span className="text-zinc-400">Réservant :</span> {d.name} · {d.phone} · {d.email} <button type="button" className="ml-1 text-brand" onClick={() => setStep(2)}>Modifier</button></p>
                {guests.some(Boolean) && <p><span className="text-zinc-400">{isTransport ? 'Passagers' : 'Participants'} :</span> {guests.filter(Boolean).join(', ')}</p>}
              </div>
              {paid ? (
                <>
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Comment souhaitez-vous payer ?</legend>
                    {cashOk && <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 ${d.mode === 'cash' ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}>
                      <input type="radio" name="mode" className="mt-1" required checked={d.mode === 'cash'} onChange={() => set('mode', 'cash')} />
                      <span><span className="block text-sm font-semibold">Payer à la livraison</span><span className="block text-xs text-zinc-400">Vous réglez {fcfa(total)} directement au prestataire. Votre réservation est confirmée tout de suite.</span></span>
                    </label>}
                    <label className={`flex items-start gap-3 rounded-lg border px-3 py-3 ${!methodsOk ? 'cursor-not-allowed border-white/10 opacity-50' : d.mode === 'digital' ? 'cursor-pointer border-brand bg-brand/10' : 'cursor-pointer border-white/15 hover:bg-white/5'}`}>
                      <input type="radio" name="mode" className="mt-1" required disabled={!methodsOk} checked={d.mode === 'digital'} onChange={() => set('mode', 'digital')} />
                      <span><span className="block text-sm font-semibold">Payer en ligne (ORZAYAH)</span><span className="block text-xs text-zinc-400">Mobile Money (Orange, MTN, Moov, Wave), carte Visa / Mastercard ou wallet ORZAYAH. Vous êtes redirigé vers la page de paiement sécurisée, puis revenez ici.</span></span>
                    </label>
                  </fieldset>
                  {!methodsOk && <p role="alert" className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{cashOk ? "Ce prestataire n'a pas encore activé le paiement en ligne : choisissez le paiement à la livraison." : "Ce prestataire n'accepte pas encore de paiement pour cette offre. Contactez-le ou réessayez plus tard."}</p>}
                </>
              ) : <p className="text-sm text-zinc-300">Cette offre est gratuite : aucun paiement n'est demandé.</p>}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" required className="mt-1" checked={d.accept} onChange={(e) => set('accept', e.target.checked)} />
                <span>J'accepte les <Link to="/conditions" target="_blank" className="text-brand underline">conditions de réservation</Link>.</span>
              </label>
              <Err e={book.error} />
              {book.error instanceof ApiError && book.error.code === 'email_taken' && <p className="text-sm">Cet e-mail a déjà un compte : <Link className="text-brand underline" to="/login" state={{ from: `/reserver/${offerId}` }}>connectez-vous</Link> ou choisissez « Continuer sans compte ».</p>}
              {!user && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">Votre compte BackMarket</legend>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 ${d.signup === 'create' ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}>
                    <input type="radio" name="signup" className="mt-1" required checked={d.signup === 'create'} onChange={() => set('signup', 'create')} />
                    <span><span className="block text-sm font-semibold">Créer mon compte</span><span className="block text-xs text-zinc-400">Pour retrouver vos réservations et réserver plus vite la prochaine fois.</span></span>
                  </label>
                  {d.signup === 'create' && (
                    <Field id="s-pw" label={`Mot de passe pour ${d.email} * (8 caractères minimum)`}>
                      <input id="s-pw" className="input" type="password" required minLength={8} maxLength={200} autoComplete="new-password" value={d.password} onChange={(e) => set('password', e.target.value)} />
                    </Field>
                  )}
                  <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 ${d.signup === 'guest' ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}>
                    <input type="radio" name="signup" className="mt-1" required checked={d.signup === 'guest'} onChange={() => set('signup', 'guest')} />
                    <span><span className="block text-sm font-semibold">Continuer sans compte</span><span className="block text-xs text-zinc-400">Aucune inscription : vous pourrez créer votre compte plus tard depuis votre confirmation.</span></span>
                  </label>
                  <p className="text-xs text-zinc-500">Vous avez déjà un compte ? <Link className="text-brand underline" to="/login" state={{ from: `/reserver/${offerId}` }}>Connectez-vous</Link></p>
                </fieldset>
              )}
              <div className="flex justify-between gap-2">
                <button type="button" className="btn-ghost" onClick={() => setStep(2)}>Retour</button>
                <button className="btn" disabled={book.isPending || !canSubmit || (!user && (!d.signup || (d.signup === 'create' && d.password.length < 8)))}>
                  {book.isPending ? 'Un instant…' : online ? `Payer ${fcfa(total)}` : 'Confirmer ma réservation'}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="order-1 lg:order-2" aria-label="Récapitulatif">
          <div className="card space-y-3 lg:sticky lg:top-24">
            {o.photoCount > 0 && <img src={`/api/offers/${o.id}/photos/0`} alt={o.title} className="aspect-[16/10] w-full rounded-lg object-cover" />}
            <div>
              <h2 className="font-semibold">{o.title}</h2>
              <p className="text-sm text-zinc-400">{o.companyName}</p>
            </div>
            <dl className="space-y-1 text-sm">
              <Row k="Lieu" v={placeLabel(o)} />
              {d.stop && <Row k={isTransport ? 'Arrêt' : 'Rendez-vous'} v={d.stop} />}
              <Row k="Places" v={String(d.seats)} />
              <Row k="Prix unitaire" v={price ? fcfa(price) : 'Gratuit'} />
            </dl>
            <div className="flex items-baseline justify-between border-t border-white/10 pt-3"><span className="text-sm text-zinc-400">{paid && d.mode === 'cash' ? 'À payer à la livraison' : 'Total à payer'}</span><span className="text-xl font-bold">{paid ? fcfa(total) : 'Gratuit'}</span></div>
          </div>
        </aside>
      </div>

      {paying && (
        <PaymentPanel paymentId={paying.paymentId}
          onPaid={() => setTimeout(() => nav(`/reservation/${paying.bookingId}`, { replace: true }), 1200)}
          onClose={() => nav('/account')} />
      )}
    </div>
  );
}

const Field = ({ id, label, cls = '', children }: { id: string; label: string; cls?: string; children: ReactNode }) => (
  <div className={`space-y-1 ${cls}`}><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}</div>
);
const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><dt className="text-zinc-500">{k}</dt><dd className="text-right">{v}</dd></div>;
