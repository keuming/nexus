import { useEffect, useState } from 'react';
import { useT } from '../lib/i18n';

/** Publicité plein écran affichée à l'ouverture du site, pour tous les pays (une fois par session, page d'accueil seulement : les liens partagés d'offres s'ouvrent directement). */
const SPLASH = { image: '/garan-offre.jpg', link: 'https://apps.garan.solutions/?code=E7GQT9', alt: 'gaRAN : votre téléphone protégé contre le vol' };
const KEY = 'bm-splash-seen';

export function Splash() {
  const t = useT();
  const [open, setOpen] = useState(() => {
    try { return window.location.pathname === '/' && !sessionStorage.getItem(KEY); } catch { return true; }
  });
  const close = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ } setOpen(false); };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  const go = () => { try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ } };
  return (
    <div role="dialog" aria-modal="true" aria-label={t('Publicité') + ' gaRAN'} className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-black/95 p-4">
      <div className="ad-in flex w-full max-w-[min(92vw,70vh)] flex-col items-stretch gap-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-amber-400/60 bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">📢 {t('Publicité')}</span>
          <button type="button" autoFocus className="rounded-full bg-white/10 px-3 py-1 text-sm text-zinc-200 hover:bg-white/20" onClick={close} aria-label={t('Fermer la publicité')}>{t('Fermer')} ✕</button>
        </div>
        <a href={SPLASH.link} onClick={go} rel="noopener sponsored" className="ad-float group relative block overflow-hidden rounded-2xl shadow-2xl ring-1 ring-emerald-400/40">
          <img src={SPLASH.image} alt={SPLASH.alt} className="max-h-[62vh] w-full object-contain" />
          <span className="ad-shine absolute inset-0 overflow-hidden" aria-hidden />
        </a>
        <a href={SPLASH.link} onClick={go} rel="noopener sponsored" className="ad-pulse flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-center text-base font-bold text-black hover:bg-emerald-400">
          {t('Touchez ici pour découvrir gaRAN')} <span className="ad-point" aria-hidden>→</span>
        </a>
        <p className="text-center text-xs text-zinc-400">{t('Vous serez redirigé vers apps.garan.solutions')}</p>
        <button type="button" className="mx-auto text-sm text-zinc-300 underline underline-offset-4 hover:text-white" onClick={close}>{t('Continuer vers BackMarket ✕')}</button>
      </div>
    </div>
  );
}
