import { SITE } from '../../shared/site';

/** Base des liens partagés : domaine officiel (jamais une adresse de prévisualisation), sauf en local. */
export function shareBase(origin: string): string {
  try { const h = new URL(origin).hostname; return h === 'localhost' || h === '127.0.0.1' ? origin : SITE.url; }
  catch { return SITE.url; }
}

/** Adresse absolue partageable d'une page du site. */
export const absUrl = (path: string, origin = typeof window === 'undefined' ? SITE.url : window.location.origin) =>
  new URL(path, shareBase(origin)).toString();

/** Liens de partage web. Le message contient titre, description et lien : le destinataire sait de quoi il s'agit même si l'application n'affiche pas d'aperçu du lien. */
export function shareTargets(url: string, title: string, text = '') {
  const body = [title, text, url].filter(Boolean).join('\n');
  const u = encodeURIComponent(url), t = encodeURIComponent(text ? `${title}\n${text}` : title), msg = encodeURIComponent(body);
  return [
    { name: 'WhatsApp', href: `https://wa.me/?text=${msg}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: 'X (Twitter)', href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${t}` },
    { name: 'E-mail', href: `mailto:?subject=${t}&body=${msg}` },
    { name: 'SMS', href: `sms:?&body=${msg}` },
  ];
}
