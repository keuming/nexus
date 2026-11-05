import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth, type User } from '../lib/auth';
import { InstallButton } from '../lib/pwa';
import { NotificationBell } from './NotificationBell';
import { Footer } from './Footer';

export function Layout() {
  const { user, logout } = useAuth();
  const pending = useQuery({ queryKey: ['admin-stats'], enabled: user?.role === 'admin', queryFn: () => unwrap(api.admin.stats.$get()), refetchInterval: 60_000 });
  const link = ({ isActive }: { isActive: boolean }) => `text-sm ${isActive ? 'text-brand' : 'text-zinc-300 hover:text-white'}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 print:hidden border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">Back<span className="text-brand">Market</span></Link>
          <nav className="order-last flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-1 sm:order-none sm:w-auto">
            <NavLink to="/" className={link} end>Catalogue</NavLink>
            {!user && <NavLink to="/souscription" className={link}>Devenir partenaire</NavLink>}
            {user?.role === 'customer' && <NavLink to="/account" className={link}>Mes réservations</NavLink>}
            {user?.role === 'owner' && <NavLink to="/company" className={link}>Mon entreprise</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={link}>Administration{pending.data?.pending ? <span className="ml-1 rounded-full bg-brand px-1.5 text-xs font-bold text-black">{pending.data.pending}</span> : null}</NavLink>}
          </nav>
          {user ? (
            <div className="flex items-center gap-3">
              <InstallButton />
              {(user.role === 'owner' || user.role === 'admin') && <NotificationBell />}
              <span className="hidden text-sm text-zinc-400 sm:inline">{user.name}</span>
              <button className="btn-ghost" onClick={logout}>Déconnexion</button>
            </div>
          ) : (
            <div className="flex items-center gap-2"><InstallButton /><Link className="btn-ghost" to="/login">Connexion</Link><Link className="btn" to="/register">Créer un compte</Link></div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><Outlet /></main>
      <Footer />
    </div>
  );
}

export function Guard({ roles, children }: { roles: User['role'][]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-zinc-400">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const Err = ({ e }: { e: unknown }) => e ? <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{e instanceof Error ? e.message : 'Erreur'}</p> : null;
