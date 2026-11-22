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
  return (
    <div role="dialog" aria-modal="true" aria-label="Publicité gaRAN" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/90 p-4">
      <a href={SPLASH.link} onClick={() => { try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ } }} rel="noopener sponsored" className="block max-h-[80vh] max-w-[min(92vw,80vh)]">
        <img src={SPLASH.image} alt={SPLASH.alt} className="max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl" />
      </a>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{t('Publicité')}</p>
      <button type="button" autoFocus className="btn-ghost" onClick={close}>{t('Continuer vers BackMarket ✕')}</button>
    </div>
  );
}
