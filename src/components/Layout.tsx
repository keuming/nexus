import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth, type User } from '../lib/auth';
import { InstallButton } from '../lib/pwa';
import { NotificationBell } from './NotificationBell';
import { Footer } from './Footer';
import { useMyCompany } from '../lib/company';
import { BACKOFFICE_HOST } from '../lib/host';
import { LangSwitch, useT } from '../lib/i18n';

export function Layout() {
  const { user, logout } = useAuth();
  const t = useT();
  const mine = useMyCompany();
  const home = user?.role === 'owner' && mine.data ? `/boutique/${mine.data.id}` : '/';
  const pending = useQuery({ queryKey: ['admin-stats'], enabled: user?.role === 'admin', queryFn: () => unwrap(api.admin.stats.$get()), refetchInterval: 60_000 });
  const link = ({ isActive }: { isActive: boolean }) => `text-sm ${isActive ? 'text-brand' : 'text-zinc-300 hover:text-white'}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 print:hidden border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Link to={home} className="text-lg font-extrabold tracking-tight">Back<span className="text-brand">Market</span></Link>
          <div className="order-last w-full text-center lg:order-none lg:w-auto lg:flex-1 lg:px-4">
            <p className="text-base font-extrabold leading-tight tracking-tight sm:text-lg">{t('Réservez en Afrique, simplement.').replace(/[^ ]+$/, '')}<span className="text-brand">{t('Réservez en Afrique, simplement.').split(' ').pop()}</span></p>
            <p className="mx-auto max-w-2xl text-[11px] leading-snug text-zinc-400 sm:text-xs">{t('Transport, hôtels, restaurants, loisirs, high-tech, mode et beauté auprès d’entreprises validées par BackMarket.')}</p>
          </div>
          <nav className="flex items-center gap-x-4">
            {user?.role === 'customer' && <NavLink to="/favoris" className={link}>{t('♥ Favoris')}</NavLink>}
            {user?.role === 'customer' && <NavLink to="/account" className={link}>{t('Mes réservations')}</NavLink>}
            {!user && <NavLink to="/souscription" className={link}>{t('Devenir partenaire')}</NavLink>}
          </nav>
          <div className="flex items-center gap-2">
            <LangSwitch />
            <InstallButton />
            {(user?.role === 'owner' || user?.role === 'admin') && <NotificationBell />}
            {user ? (
              <>
                <a className="btn" href={user.role === 'admin' ? `https://${BACKOFFICE_HOST}/admin` : user.role === 'owner' ? '/company' : '/account'}>{t('Accès compte')}</a>
                <button className="btn-ghost" onClick={logout}>{t('Déconnexion')}</button>
              </>
            ) : (
              <><Link className="btn" to="/login">{t('Accès compte')}</Link><Link className="btn-ghost" to="/register">{t('Créer un compte')}</Link></>
            )}
          </div>
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
