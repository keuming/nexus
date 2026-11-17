import { useEffect, useState } from 'react';

interface Props { url: string; title: string; text?: string; label?: string; className?: string; iconOnly?: boolean }

/** Adresse absolue d'une page du site (le lien partagé doit fonctionner hors du site). */
export const absUrl = (path: string) => new URL(path, window.location.origin).toString();

/**
 * Bouton « Partager » : menu natif du téléphone s'il existe (Instagram, TikTok, Messenger, etc. y apparaissent),
 * sinon fenêtre avec WhatsApp, Facebook, LinkedIn, X, Telegram, e-mail, SMS et copie du lien.
 * Instagram et TikTok n'ont pas de lien de partage web : on copie le lien à coller dans une story, un message ou la bio.
 */
export function ShareButton({ url, title, text = '', label = 'Partager', className = 'btn-ghost', iconOnly = false }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const start = async () => {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title, text, url }); return; }
      catch (e) { if ((e as Error).name === 'AbortError') return; }
    }
    setOpen(true);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { window.prompt('Copiez ce lien :', url); }
  };

  const u = encodeURIComponent(url);
  const msg = encodeURIComponent(`${title}${text ? `\n${text}` : ''}\n${url}`);
  const t = encodeURIComponent(title);
  const targets = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${msg}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: 'E-mail', href: `mailto:?subject=${t}&body=${msg}` },
    { name: 'SMS', href: `sms:?&body=${msg}` },
  ];

  return (
    <>
      <button type="button" className={className} onClick={start} aria-label={iconOnly ? label : undefined} title={label}>
        {iconOnly ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
        ) : label}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Partager" className="card w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h2 className="text-base font-bold">Partager</h2><button type="button" aria-label="Fermer" className="text-xl leading-none text-zinc-400 hover:text-white" onClick={() => setOpen(false)}>×</button></div>
            <p className="line-clamp-2 text-sm text-zinc-300">{title}</p>
            <div className="grid grid-cols-2 gap-2">
              {targets.map((x) => <a key={x.name} className="btn-ghost text-center" href={x.href} target="_blank" rel="noopener noreferrer">{x.name}</a>)}
            </div>
            <button type="button" className="btn w-full" onClick={copy}>{copied ? 'Lien copié ✓' : 'Copier le lien'}</button>
            <p className="text-xs text-zinc-500">Instagram et TikTok : copiez le lien, puis collez-le dans votre story, votre bio ou un message.</p>
          </div>
        </div>
      )}
    </>
  );
}
