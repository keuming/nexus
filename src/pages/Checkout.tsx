import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { PaymentPanel } from '../components/PaymentPanel';
import { countryName } from '../../shared/geo';

type Step = 1 | 2 | 3;
const STEPS = ['Ma sélection', 'Mes informations', 'Paiement', 'Confirmation'];
const NOUN: Record<string, string> = { transport: 'passager', hotel: 'occupant', residence_meuble: 'occupant' };

interface Draft {
  seats: number; stop: string; name: string; phone: string; email: string; guests: string[]; note: string;
  operator: string; account: string; accept: boolean;
}
const key = (id: string) => `nx-checkout-${id}`;
const load = (id: string): Partial<Draft> => { try { return JSON.parse(sessionStorage.getItem(key(id)) ?? '{}'); } catch { return {}; } };
const save = (id: string, d: Draft) => { try { sessionStorage.setItem(key(id), JSON.stringify({ ...d, accept: false })); } catch { /* stockage indisponible */ } };

/** Parcours de réservation en ligne : sélection → informations du réservant → paiement ORZAYAH → confirmation. */
export function Checkout() {
  const { offerId = '' } = useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const offer = useQuery({ queryKey: ['offer', offerId], queryFn: () => unwrap(api.offers[':id'].$get({ param: { id: offerId } })), retry: false });
  const methods = useQuery({ queryKey: ['pay-methods'], queryFn: () => unwrap(api.payments.methods.$get()), staleTime: 60_000 });
  const [step, setStep] = useState<Step>(1);
  const [d, setD] = useState<Draft>(() => ({ seats: 1, stop: '', name: '', phone: '', email: '', guests: [], note: '', operator: '', account: '', accept: false, ...load(offerId) }));
  const [paying, setPaying] = useState<{ paymentId: string; bookingId: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  // Préremplit avec le compte, sans écraser ce que le client a déjà saisi.
  useEffect(() => { if (user) setD((x) => ({ ...x, name: x.name || user.name, email: x.email || user.email })); }, [user]);
  useEffect(() => { save(offerId, d); }, [offerId, d]);

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
    mutationFn: () => unwrap(api.bookings.$post({ json: {
      offerId, seats: d.seats, ...(needsStop ? { stop: d.stop } : {}),
      contact: { name: d.name, phone: d.phone, email: d.email },
      guests: guests.map((g) => g.trim()).filter(Boolean), note: d.note, acceptTerms: true as const,
      ...(paid ? { payment: { operator: d.operator as 'ORANGE', accountNumber: d.account } } : {}),
    } })),
    onSuccess: (r) => {
      try { sessionStorage.removeItem(key(offerId)); } catch { /* ignore */ }
      if (r.payment) setPaying({ paymentId: r.payment.id, bookingId: r.booking.id });
      else nav(`/reservation/${r.booking.id}`, { replace: true });
    },
  });

  if (loading) return <p className="text-center text-zinc-400">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: `/reserver/${offerId}` }} />;
  if (offer.isLoading) return <p className="text-center text-zinc-400">Chargement de l'offre…</p>;
  if (offer.error || !o) return <div className="mx-auto max-w-md space-y-3 text-center"><Err e={offer.error ?? new Error('Offre introuvable ou indisponible')} /><Link className="btn" to="/">Retour au catalogue</Link></div>;
  if (o.remaining < 1) return <div className="mx-auto max-w-md space-y-3 text-center"><p className="text-zinc-300">Cette offre est complète.</p><Link className="btn" to="/">Retour au catalogue</Link></div>;

  const next = (e: FormEvent, to: Step) => { e.preventDefault(); book.reset(); setStep(to); window.scrollTo({ top: 0 }); };
  const pay = (e: FormEvent) => { e.preventDefault(); book.mutate(); };
  const methodsOk = methods.data?.available !== false;

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
                  {!methodsOk && <p role="alert" className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">Le paiement en ligne est momentanément indisponible. Réessayez plus tard.</p>}
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Moyen de paiement ORZAYAH</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {(methods.data?.methods ?? []).map((m) => (
                        <label key={m.id} className={`cursor-pointer rounded-lg border px-3 py-3 text-center text-sm font-medium ${d.operator === m.id ? 'border-brand bg-brand/10' : 'border-white/15 hover:bg-white/5'}`}>
                          <input type="radio" name="op" className="sr-only" required checked={d.operator === m.id} onChange={() => set('operator', m.id)} />{m.label}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500">Paiement sécurisé par ORZAYAH : vous validez la transaction sur votre téléphone.</p>
                  </fieldset>
                  <Field id="p-acc" label="Numéro Mobile Money à débiter *">
                    <input id="p-acc" className="input" inputMode="tel" required placeholder="Ex. 0707070707 (sans l'indicatif du pays)" value={d.account} onChange={(e) => set('account', e.target.value)} />
                  </Field>
                </>
              ) : <p className="text-sm text-zinc-300">Cette offre est gratuite : aucun paiement n'est demandé.</p>}
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" required className="mt-1" checked={d.accept} onChange={(e) => set('accept', e.target.checked)} />
                <span>J'accepte les <Link to="/conditions" target="_blank" className="text-brand underline">conditions de réservation</Link>.</span>
              </label>
              <Err e={book.error} />
              <div className="flex justify-between gap-2">
                <button type="button" className="btn-ghost" onClick={() => setStep(2)}>Retour</button>
                <button className="btn" disabled={book.isPending || (paid && (!methodsOk || d.account.replace(/\D/g, '').length < 8 || !d.operator))}>
                  {book.isPending ? 'Un instant…' : paid ? `Payer ${fcfa(total)}` : 'Confirmer ma réservation'}
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
              <Row k="Lieu" v={`${o.city ? `${o.city} → ` : ''}${countryName(o.country)}`} />
              <Row k="Date" v={dateFr(o.startsAt)} />
              {d.stop && <Row k={isTransport ? 'Arrêt' : 'Rendez-vous'} v={d.stop} />}
              <Row k="Places" v={String(d.seats)} />
              <Row k="Prix unitaire" v={price ? fcfa(price) : 'Gratuit'} />
            </dl>
            <div className="flex items-baseline justify-between border-t border-white/10 pt-3"><span className="text-sm text-zinc-400">Total à payer</span><span className="text-xl font-bold">{paid ? fcfa(total) : 'Gratuit'}</span></div>
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
