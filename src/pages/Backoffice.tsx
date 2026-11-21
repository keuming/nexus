import { useState, type FormEvent } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { NotificationBell } from '../components/NotificationBell';
import { AdminDashboard } from './AdminDashboard';

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

function BackofficeLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <span className="text-lg font-extrabold tracking-tight">Back<span className="text-brand">Market</span> <span className="text-sm font-medium text-zinc-400">· Back-office</span></span>
          {user?.role === 'admin' && (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="hidden text-sm text-zinc-400 sm:inline">{user.name}</span>
              <button className="btn-ghost" onClick={logout}>Déconnexion</button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10"><Outlet /></main>
    </div>
  );
}

function AdminOnly() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-zinc-400">Chargement…</p>;
  if (user?.role !== 'admin') return <Navigate to="/login" replace />;
  return <AdminDashboard />;
}

export function BackofficeApp() {
  return (
    <Routes>
      <Route element={<BackofficeLayout />}>
        <Route path="login" element={<BackofficeLogin />} />
        <Route path="admin" element={<AdminOnly />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
