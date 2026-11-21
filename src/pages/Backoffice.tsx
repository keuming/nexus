import { useState, type FormEvent } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { NotificationBell } from '../components/NotificationBell';
import { AdminDashboard, DisplayAdmin } from './AdminDashboard';
import { Kpis } from './backoffice/Kpis';
import { Shops } from './backoffice/Shops';
import { PartnerPayments } from './backoffice/PartnerPayments';
import { Featured } from './backoffice/Featured';
import { Ads } from './backoffice/Ads';
import { Reviews } from './backoffice/Reviews';
import { useEffect } from 'react';

/** Connexion réservée aux administrateurs : pas de création de compte, pas de lien vers le catalogue. */
function BackofficeLogin() {
  const { user, loading, refresh, logout } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const m = useMutation({
    mutationFn: () => unwrap(api.auth.login.$post({ json: f })),
    onSuccess: async () => { await refresh(); },
  });
  if (loading) return <p className="text-zinc-400">Chargement…</p>;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate(); };
  return (
    <form onSubmit={submit} className="card mx-auto mt-10 max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Back-office</h1>
      <p className="text-sm text-zinc-400">Accès réservé à l'administration BackMarket.</p>
      {user && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">Ce compte n'a pas accès au back-office. <button type="button" className="underline" onClick={logout}>Changer de compte</button></p>}
      <Err e={m.error} />
      <input className="input" type="email" required autoComplete="username" placeholder="Identifiant (e-mail)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="input" type="password" required autoComplete="current-password" placeholder="Mot de passe" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button className="btn w-full" disabled={m.isPending}>Se connecter</button>
    </form>
  );
}

const NAV: { to: string; label: string; icon: string; end?: boolean; badge?: 'pending' | 'needsRefund' }[] = [
  { to: '/admin', label: 'Tableau de bord', icon: '▦', end: true },
  { to: '/admin/demandes', label: 'Demandes partenaires', icon: '✉', badge: 'pending' },
  { to: '/admin/boutiques', label: 'Boutiques par pays', icon: '⌂' },
  { to: '/admin/paiements', label: 'Paiements partenaires', icon: '₣', badge: 'needsRefund' },
  { to: '/admin/mise-en-avant', label: 'Mise en avant', icon: '★' },
  { to: '/admin/publicites', label: 'Publicités', icon: '◎' },
  { to: '/admin/avis', label: 'Avis clients', icon: '✎' },
  { to: '/admin/affichage', label: 'Affichage du site', icon: '⚙' },
];

function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const stats = useQuery({ queryKey: ['admin-stats'], queryFn: () => unwrap(api.admin.stats.$get()), refetchInterval: 60000 });
  return (
    <nav aria-label="Menu du back-office" className="flex flex-col gap-1 p-3">
      {NAV.map((n) => {
        const b = n.badge ? stats.data?.[n.badge] ?? 0 : 0;
        return (
          <NavLink key={n.to} to={n.to} end={n.end} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-brand/15 font-semibold text-brand' : 'text-zinc-300 hover:bg-white/5'}`}>
            <span aria-hidden className="w-5 text-center">{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {b > 0 && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">{b}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

function BackofficeLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  const admin = user?.role === 'admin';
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ink/90 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            {admin && <button className="btn-ghost lg:hidden" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>☰</button>}
            <span className="text-lg font-extrabold tracking-tight">Back<span className="text-brand">Market</span> <span className="text-sm font-medium text-zinc-400">· Back-office</span></span>
          </div>
          {admin && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="hidden text-sm text-zinc-400 sm:inline">{user.name}</span>
              <button className="btn-ghost" onClick={logout}>Déconnexion</button>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        {admin && (
          <aside className={`${open ? 'block' : 'hidden'} fixed inset-x-0 bottom-0 top-[57px] z-10 overflow-y-auto bg-ink lg:sticky lg:top-[57px] lg:block lg:h-[calc(100vh-57px)] lg:w-64 lg:shrink-0 lg:border-r lg:border-white/10`}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        )}
        <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8"><Outlet /></main>
      </div>
    </div>
  );
}

function AdminOnly() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-zinc-400">Chargement…</p>;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function BackofficeApp() {
  return (
    <Routes>
      <Route element={<BackofficeLayout />}>
        <Route path="login" element={<BackofficeLogin />} />
        <Route path="admin" element={<AdminOnly />}>
          <Route index element={<Kpis />} />
          <Route path="demandes" element={<AdminDashboard fixed="pending" />} />
          <Route path="boutiques" element={<Shops />} />
          <Route path="paiements" element={<PartnerPayments />} />
          <Route path="mise-en-avant" element={<Featured />} />
          <Route path="publicites" element={<Ads />} />
          <Route path="avis" element={<Reviews />} />
          <Route path="affichage" element={<DisplayAdmin />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
