import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api, unwrap } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Err } from '../components/Layout';
import { CompanyFields, coordsOk, emptyDraft, toPayload } from '../components/CompanyFields';

const Section = ({ n, title, children }: { n: number; title: string; children: ReactNode }) => (
  <section className="card space-y-4">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-sm font-bold text-black">{n}</span>{title}</h2>
    {children}
  </section>
);

/** Souscription d'une entreprise partenaire : entreprise + gérant + accès au compte, en une seule demande. */
export function Subscribe() {
  const [company, setCompany] = useState(emptyDraft());
  const [mgr, setMgr] = useState({ name: '', title: 'Gérant', phone: '', email: '', password: '', confirm: '' });
  const [ack, setAck] = useState(false);
  const [localErr, setLocalErr] = useState('');
  const { refresh } = useAuth();
  const nav = useNavigate();
  const m = useMutation({
    mutationFn: () => unwrap(api.auth['register-company'].$post({ json: {
      manager: { name: mgr.name, title: mgr.title, phone: mgr.phone, email: mgr.email, password: mgr.password },
      company: toPayload(company),
    } })),
    onSuccess: async () => { await refresh(); nav('/company'); },
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coordsOk(company)) return setLocalErr('Renseignez la géolocalisation de votre entreprise.');
    if (mgr.password !== mgr.confirm) return setLocalErr('Les deux mots de passe ne correspondent pas.');
    setLocalErr(''); m.mutate();
  };
  const g = <K extends keyof typeof mgr>(k: K, v: string) => setMgr({ ...mgr, [k]: v });

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Devenez <span className="text-brand">partenaire</span> BackMarket</h1>
        <p className="mt-2 text-sm text-zinc-400">Souscription réservée aux entreprises. Votre demande est examinée par BackMarket avant la publication de vos offres.</p>
      </header>

      <Section n={1} title="Votre entreprise"><CompanyFields value={company} onChange={setCompany} /></Section>

      <Section n={2} title="Le gérant">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><label htmlFor="m-name" className="text-sm font-medium">Nom et prénoms</label>
            <input id="m-name" className="input" required minLength={2} autoComplete="name" value={mgr.name} onChange={(e) => g('name', e.target.value)} /></div>
          <div className="space-y-1"><label htmlFor="m-title" className="text-sm font-medium">Fonction</label>
            <input id="m-title" className="input" required minLength={2} value={mgr.title} onChange={(e) => g('title', e.target.value)} /></div>
        </div>
        <div className="space-y-1"><label htmlFor="m-phone" className="text-sm font-medium">Téléphone / WhatsApp du gérant</label>
          <input id="m-phone" className="input" type="tel" required autoComplete="tel" placeholder="+225 07 00 00 00 00" value={mgr.phone} onChange={(e) => g('phone', e.target.value)} /></div>
      </Section>

      <Section n={3} title="Accès à votre espace">
        <div className="space-y-1"><label htmlFor="m-email" className="text-sm font-medium">E-mail de connexion</label>
          <input id="m-email" className="input" type="email" required autoComplete="email" value={mgr.email} onChange={(e) => g('email', e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><label htmlFor="m-pw" className="text-sm font-medium">Mot de passe</label>
            <input id="m-pw" className="input" type="password" required minLength={8} autoComplete="new-password" placeholder="8 caractères minimum" value={mgr.password} onChange={(e) => g('password', e.target.value)} /></div>
          <div className="space-y-1"><label htmlFor="m-pw2" className="text-sm font-medium">Confirmer le mot de passe</label>
            <input id="m-pw2" className="input" type="password" required minLength={8} autoComplete="new-password" value={mgr.confirm} onChange={(e) => g('confirm', e.target.value)} /></div>
        </div>
        <label className="flex items-start gap-2 text-sm text-zinc-300">
          <input type="checkbox" required className="mt-1" checked={ack} onChange={(e) => setAck(e.target.checked)} />
          J’atteste que les informations fournies sont exactes et que je suis habilité(e) à engager l’entreprise.
        </label>
      </Section>

      <Err e={localErr ? new Error(localErr) : m.error} />
      <button className="btn w-full" disabled={m.isPending || !ack}>Envoyer ma demande de souscription</button>
      <p className="text-center text-sm text-zinc-400">Déjà partenaire ? <Link to="/login" className="text-brand">Connexion</Link> · Vous souhaitez seulement réserver ? <Link to="/register" className="text-brand">Compte client</Link></p>
    </form>
  );
}
