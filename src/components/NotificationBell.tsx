import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../lib/api';

/** Cloche d'alertes : relit le serveur toutes les 20 s (et à chaque retour sur l'onglet), compteur dans le titre de l'onglet. */
export function NotificationBell() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => unwrap(api.notifications.$get()), refetchInterval: 20_000, refetchOnWindowFocus: true });
  const read = useMutation({
    mutationFn: (ids?: string[]) => unwrap(api.notifications.read.$post({ json: ids ? { ids } : {} })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const unread = q.data?.unread ?? 0;

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '');
    document.title = unread ? `(${unread}) ${base}` : base;
    return () => { document.title = base; };
  }, [unread]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={box}>
      <button className="btn-ghost relative !px-3" aria-label={`Alertes${unread ? ` (${unread} non lues)` : ''}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        <span aria-hidden>🔔</span>
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand px-1 text-center text-xs font-bold text-black">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Alertes" className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-white/15 bg-ink p-2 shadow-xl">
          <div className="flex items-center justify-between px-2 py-1">
            <strong className="text-sm">Alertes</strong>
            {unread > 0 && <button className="text-xs text-brand" onClick={() => read.mutate(undefined)}>Tout marquer comme lu</button>}
          </div>
          {!q.data?.notifications.length ? <p className="px-2 py-4 text-center text-sm text-zinc-400">Aucune alerte.</p> : (
            <ul className="max-h-96 space-y-1 overflow-y-auto">
              {q.data.notifications.map((n) => (
                <li key={n.id}>
                  <button className={`w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5 ${n.readAt ? 'text-zinc-400' : 'bg-white/5'}`}
                    onClick={() => { if (!n.readAt) read.mutate([n.id]); setOpen(false); if (n.link) nav(n.link); }}>
                    <span className="block font-medium">{!n.readAt && <span className="mr-1 text-brand">●</span>}{n.title}</span>
                    {n.body && <span className="block text-xs text-zinc-400">{n.body}</span>}
                    <span className="block text-xs text-zinc-500">{dateFr(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
