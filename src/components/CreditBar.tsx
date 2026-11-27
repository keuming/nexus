import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../lib/api';
import { Err } from './Layout';
import { useT } from '../lib/i18n';

const PRESETS = [20, 50, 100, 200];

/** Temps restant avant l'attribution d'une commande verrouillée à une autre boutique. */
function useNow(ms = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(i); }, [ms]);
  return now;
}

/**
 * Bandeau de crédit en haut du dashboard partenaire : solde, bouton d'achat, règle de réception des commandes
 * et commandes verrouillées (aucun détail tant qu'aucun crédit n'est acheté).
 */
export function CreditBar() {
  const t = useT();
  const qc = useQueryClient();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(50);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const q = useQuery({ queryKey: ['company-credits'], queryFn: () => unwrap(api.company.credits.$get()), refetchInterval: 30_000 });
  const refreshAll = () => { qc.invalidateQueries({ queryKey: ['company-credits'] }); qc.invalidateQueries({ queryKey: ['company'] }); qc.invalidateQueries({ queryKey: ['company-bookings'] }); };

  // Retour de la page de paiement ORZAYAH (?credits=<achat>) : relecture chez ORZAYAH puis crédit du solde.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('credits');
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return;
    let stop = false; let tries = 0;
    const run = async () => {
      try {
        const r = await unwrap(api.company.credits.purchases[':id'].sync.$post({ param: { id } }));
        if (stop) return;
        if (r.status === 'paid') { setNotice({ ok: true, text: t('Paiement reçu : votre solde de crédits est à jour.') }); refreshAll(); window.history.replaceState(null, '', window.location.pathname); return; }
        if (r.status === 'failed' || r.status === 'expired') { setNotice({ ok: false, text: t("Le paiement n'a pas abouti : aucun crédit n'a été ajouté.") }); window.history.replaceState(null, '', window.location.pathname); return; }
      } catch { /* on réessaie */ }
      if (++tries < 8 && !stop) setTimeout(run, 4000);
      else if (!stop) setNotice({ ok: false, text: t("Paiement en cours de vérification : votre solde sera mis à jour dès confirmation d'ORZAYAH.") });
    };
    setNotice({ ok: true, text: t('Vérification de votre paiement…') });
    run();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buy = useMutation({
    mutationFn: () => unwrap(api.company.credits.purchase.$post({ json: { credits: n } })),
    onSuccess: (r) => { if (r.payUrl && /^https:\/\//.test(r.payUrl)) window.location.href = r.payUrl; else setNotice({ ok: false, text: t("Lien de paiement indisponible : réessayez dans un instant.") }); },
  });
  const submit = (e: FormEvent) => { e.preventDefault(); buy.mutate(); };

  const d = q.data;
  if (q.isLoading) return null;
  if (!d) return q.error ? <Err e={q.error} /> : null;
  const credits = d.credits;
  const empty = credits < 1;
  const low = !empty && credits <= 3;
  const tone = empty ? 'border-red-500 bg-red-500/10' : low ? 'border-amber-500 bg-amber-500/10' : 'border-brand/60 bg-brand/5';
  const valid = Number.isInteger(n) && n >= 1 && n <= 5000;
  return (
    <section aria-label={t('Crédits')} className={`rounded-2xl border-2 p-4 sm:p-5 ${tone}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-300">{t('Solde de crédits disponible')}</p>
          <p className={`text-5xl font-extrabold tabular-nums ${empty ? 'text-red-400' : low ? 'text-amber-300' : 'text-brand'}`} aria-live="polite">{credits}</p>
          <p className="text-xs text-zinc-400">{t('1 crédit = 1 commande reçue')} · {fcfa(d.priceFcfa)} / {t('crédit')}</p>
        </div>
        <button type="button" className="btn !px-6 !py-3 text-base" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{t('Acheter du crédit')}</button>
      </div>

      <div role="note" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${empty ? 'border-red-400/60 bg-red-500/15 text-red-100' : 'border-amber-400/50 bg-amber-500/10 text-amber-100'}`}>
        <p className="font-bold">⚠ {empty ? t('Vous n’avez plus de crédit : vous ne recevez plus vos commandes.') : t('Du crédit est nécessaire pour recevoir les commandes de vos clients.')}</p>
        <p className="mt-1">{t('Sans crédit, chaque commande client vous est seulement signalée, sans aucun détail (ni le client, ni l’article commandé). Si vous n’achetez pas de crédit dans l’heure, la commande est attribuée à une autre boutique qui propose la même marchandise : vous la perdez.')}</p>
      </div>

      {notice && <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${notice.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>{notice.text}</p>}

      {d.locked.length > 0 && (
        <div className="mt-4 rounded-xl border border-red-400/60 bg-black/20 p-3">
          <p className="font-semibold text-red-200">🔒 {t('{n} commande(s) verrouillée(s) en attente de votre crédit', { n: d.locked.length })}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {d.locked.map((l, i) => {
              const mins = Math.max(0, Math.ceil((new Date(l.lockUntil!).getTime() - now) / 60_000));
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <span>{t('Commande n°{i}', { i: i + 1 })} · {t('reçue le')} {dateFr(l.createdAt)} · <span className="text-zinc-400">{t('détails masqués')}</span></span>
                  <span className={`font-bold ${mins <= 10 ? 'text-red-300' : 'text-amber-300'}`}>{mins > 0 ? t('Attribution à une autre boutique dans {m} min', { m: mins }) : t('Attribution en cours…')}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-zinc-400">{t('Achetez du crédit : chaque commande débloquée coûte 1 crédit et ses détails s’affichent aussitôt.')}</p>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-white/15 bg-black/20 p-4">
          <p className="font-semibold">{t('Combien de crédits voulez-vous acheter ?')}</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => <button type="button" key={p} aria-pressed={n === p} onClick={() => setN(p)} className={`rounded-full border px-4 py-1.5 text-sm ${n === p ? 'border-brand bg-brand text-black' : 'border-white/20 hover:bg-white/5'}`}>{p}</button>)}
            <label className="flex items-center gap-2 text-sm text-zinc-300">{t('Autre quantité')}
              <input className="input !w-28" type="number" min={1} max={5000} step={1} value={Number.isFinite(n) ? n : ''} onChange={(e) => setN(Math.floor(Number(e.target.value)))} />
            </label>
          </div>
          <p className="text-lg font-bold">{valid ? fcfa(n * d.priceFcfa) : '—'} <span className="text-sm font-normal text-zinc-400">{valid ? `· ${n} ${t('crédits')}` : ''}</span></p>
          <Err e={buy.error} />
          {!d.onlinePurchase && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300">{t("L'achat en ligne est momentanément indisponible.")}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn" disabled={!valid || buy.isPending || !d.onlinePurchase}>{buy.isPending ? t('Redirection…') : t('Payer avec ORZAYAH')}</button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t('Annuler')}</button>
          </div>
          {d.countryManager && (
            <p className="text-xs text-zinc-400">{t('Besoin d’aide ? Contactez votre administrateur pays')} : {d.countryManager.name}{d.countryManager.phone ? ` · ${d.countryManager.phone}` : ''}</p>
          )}
        </form>
      )}
    </section>
  );
}
