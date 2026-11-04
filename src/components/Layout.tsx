import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type User } from '../lib/auth';

export function Layout() {
  const { user, logout } = useAuth();
  const link = ({ isActive }: { isActive: boolean }) => `text-sm ${isActive ? 'text-brand' : 'text-zinc-300 hover:text-white'}`;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-3">
          <Link to="/" className="text-lg font-extrabold tracking-tight">NEX<span className="text-brand">US</span></Link>
          <nav className="flex flex-1 items-center gap-4">
            <NavLink to="/" className={link} end>Catalogue</NavLink>
            {user?.role === 'customer' && <NavLink to="/account" className={link}>Mes réservations</NavLink>}
            {user?.role === 'owner' && <NavLink to="/company" className={link}>Mon entreprise</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={link}>Administration</NavLink>}
          </nav>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-zinc-400 sm:inline">{user.name}</span>
              <button className="btn-ghost" onClick={logout}>Déconnexion</button>
            </div>
          ) : (
            <div className="flex gap-2"><Link className="btn-ghost" to="/login">Connexion</Link><Link className="btn" to="/register">Créer un compte</Link></div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
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
