import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';

function useAuthForm(kind: 'login' | 'register') {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  return useMutation({
    mutationFn: (f: { email: string; password: string; name: string; role: 'customer' }) =>
      kind === 'login' ? unwrap(api.auth.login.$post({ json: { email: f.email, password: f.password } })) : unwrap(api.auth.register.$post({ json: f })),
    onSuccess: async (r) => {
      await refresh();
      const role = (r as { user: { role: string } }).user.role;
      nav(from && from.startsWith('/') && !from.startsWith('//') ? from : role === 'admin' ? '/admin' : role === 'owner' ? '/company' : '/');
    },
  });
}

export function Login() {
  const [f, setF] = useState({ email: '', password: '' });
  const m = useAuthForm('login');
  const submit = (e: FormEvent) => { e.preventDefault(); m.mutate({ ...f, name: '', role: 'customer' }); };
  return (
    <form onSubmit={submit} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Connexion</h1>
      <Err e={m.error} />
      <input className="input" type="email" required autoComplete="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="input" type="password" required autoComplete="current-password" placeholder="Mot de passe" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button className="btn w-full" disabled={m.isPending}>Se connecter</button>
      <p className="text-sm text-zinc-400">Pas de compte ? <Link className="text-brand" to="/register" state={useLocation().state}>Créer un compte</Link></p>
    </form>
  );
}

export function Register() {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'customer' as const });
  const m = useAuthForm('register');
  return (
    <form onSubmit={(e) => { e.preventDefault(); m.mutate(f); }} className="card mx-auto max-w-sm space-y-3">
      <h1 className="text-xl font-bold">Créer un compte</h1>
      <Err e={m.error} />
      <input className="input" required minLength={2} placeholder="Nom" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className="input" type="email" required autoComplete="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input className="input" type="password" required minLength={8} autoComplete="new-password" placeholder="Mot de passe (8 caractères min.)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button className="btn w-full" disabled={m.isPending}>Créer mon compte</button>
      <p className="text-center text-sm text-zinc-400">Vous êtes une entreprise ? <Link className="text-brand" to="/souscription">Devenir partenaire</Link></p>
    </form>
  );
}
