import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';

/** Étoiles de notation (lecture seule). */
export function RatingStars({ avg, count }: { avg?: number | null; count?: number }) {
  const t = useT();
  if (!count || !avg) return <span className="text-[11px] text-zinc-500">{t("Pas encore d'avis")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Note ${avg} sur 5, ${count} avis`}>
      <span className="text-amber-400" aria-hidden>★</span><strong>{avg.toFixed(1)}</strong><span className="text-xs text-zinc-500">({count})</span>
    </span>
  );
}

/** Bouton cœur : ajoute / retire des favoris ; un visiteur non connecté est envoyé vers la connexion. */
export function FavButton({ offerId, className = '' }: { offerId: string; className?: string }) {
  const t = useT();
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const ids = useQuery({ queryKey: ['fav-ids'], enabled: !!user, staleTime: 60_000, queryFn: () => unwrap(api.favorites.ids.$get()) });
  const on = !!ids.data?.ids.includes(offerId);
  const m = useMutation({
    mutationFn: (add: boolean) => unwrap(add ? api.favorites[':id'].$put({ param: { id: offerId } }) : api.favorites[':id'].$delete({ param: { id: offerId } })),
    onMutate: async (add) => {
      await qc.cancelQueries({ queryKey: ['fav-ids'] });
      const prev = qc.getQueryData<{ ids: string[] }>(['fav-ids']);
      qc.setQueryData<{ ids: string[] }>(['fav-ids'], { ids: add ? [...(prev?.ids ?? []), offerId] : (prev?.ids ?? []).filter((x) => x !== offerId) });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(['fav-ids'], ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['fav-ids'] }); qc.invalidateQueries({ queryKey: ['favorites'] }); },
  });
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t('Retirer des favoris') : t('Ajouter aux favoris')}
      className={`grid h-9 w-9 place-items-center rounded-full bg-black/50 text-lg backdrop-blur transition hover:bg-black/70 ${on ? 'text-red-400' : 'text-white'} ${className}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!user) { nav('/login', { state: { from: loc.pathname + loc.search } }); return; } m.mutate(!on); }}>
      {on ? '♥' : '♡'}
    </button>
  );
}

export interface AdItem { id: string; advertiser: string; title: string; body: string; imageUrl: string | null; linkUrl: string; ctaLabel: string; slot: string }

/** Publicités du pays du visiteur ; chaque annonce n'est comptée qu'une fois par session. */
export function useAds(country: string) {
  return useQuery({ queryKey: ['ads', country], staleTime: 5 * 60_000, queryFn: () => unwrap(api.ads.$get({ query: country ? { country } : {} })) });
}

const seen = new Set<string>();
function useViewOnce(id: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen.has(id)) return;
    const fire = () => { if (seen.has(id)) return; seen.add(id); api.ads[':id'].view.$post({ param: { id } }).catch(() => undefined); };
    if (typeof IntersectionObserver === 'undefined') { fire(); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fire(); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [id]);
  return ref;
}

function AdLink({ ad, className, children }: { ad: AdItem; className?: string; children: React.ReactNode }) {
  const click = () => { api.ads[':id'].click.$post({ param: { id: ad.id } }).catch(() => undefined); };
  return ad.linkUrl.startsWith('/')
    ? <Link to={ad.linkUrl} onClick={click} className={className}>{children}</Link>
    : <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer sponsored" onClick={click} className={className}>{children}</a>;
}

/** Bandeau publicitaire en haut du catalogue. */
export function AdBanner({ ad }: { ad: AdItem }) {
  const t = useT();
  const ref = useViewOnce(ad.id) as React.RefObject<HTMLElement>;
  return (
    <aside ref={ref} aria-label="Publicité" className="card flex flex-col items-stretch gap-4 overflow-hidden !p-0 sm:flex-row">
      {ad.imageUrl && <img src={ad.imageUrl} alt="" loading="lazy" className="aspect-[3/1] w-full object-cover sm:w-2/5" />}
      <div className="flex flex-1 flex-col justify-center gap-1 p-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t('Publicité')} · {ad.advertiser}</span>
        <p className="text-lg font-semibold leading-snug">{ad.title}</p>
        {ad.body && <p className="text-sm text-zinc-400">{ad.body}</p>}
        <div className="pt-2"><AdLink ad={ad} className="btn inline-block">{ad.ctaLabel}</AdLink></div>
      </div>
    </aside>
  );
}

/** Annonce au format carte, glissée parmi les offres. */
export function AdCard({ ad }: { ad: AdItem }) {
  const t = useT();
  const ref = useViewOnce(ad.id) as React.RefObject<HTMLElement>;
  return (
    <aside ref={ref} aria-label="Publicité" className="card flex flex-col overflow-hidden !p-0 border-dashed">
      {ad.imageUrl ? <img src={ad.imageUrl} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] w-full bg-gradient-to-br from-white/10 to-white/0" />}
      <div className="flex flex-1 flex-col gap-1 px-4 pb-4 pt-3">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">{t('Sponsorisé')} · {ad.advertiser}</span>
        <p className="font-semibold leading-snug">{ad.title}</p>
        {ad.body && <p className="line-clamp-3 text-sm text-zinc-400">{ad.body}</p>}
        <div className="mt-auto pt-3"><AdLink ad={ad} className="btn block text-center">{ad.ctaLabel}</AdLink></div>
      </div>
    </aside>
  );
}
