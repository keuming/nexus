import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { CountrySelect } from '../../components/ChipInput';
import { useCountryName, useT } from '../../lib/i18n';
import { PageTitle } from './ui';

/** Libellé lisible d'une action du journal (méthode + chemin de l'API, sans aucune donnée saisie). */
function actionLabel(method: string, path: string, t: (s: string) => string) {
  const p = path.replace(/^\/api\//, '').replace(/[0-9a-f]{8}-[0-9a-f-]{27}/g, '…');
  return `${t(method === 'DELETE' ? 'Suppression' : method === 'POST' ? 'Création / action' : 'Modification')} · ${p}`;
}

function Detail({ id }: { id: string }) {
  const t = useT();
  const q = useQuery({ queryKey: ['bo-admin', id], queryFn: () => unwrap(api.admin.admins[':id'].$get({ param: { id } })) });
  if (q.isLoading) return <p className="text-sm text-zinc-400">{t('Chargement…')}</p>;
  if (!q.data) return <Err e={q.error} />;
  const { admin: a, stats: s, recent } = q.data;
  const row = (k: string, v: string | number) => <div className="flex justify-between gap-3 border-b border-zinc-800 py-1"><dt className="text-zinc-400">{t(k)}</dt><dd className="font-medium">{v}</dd></div>;
  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      <dl>
        {row('Email', a.email)}
        {row('Téléphone du pays', a.phone || '—')}
        {row('N° de compte ORZAYAH du pays', a.orzAccount || '—')}
        {row('Compte créé le', dateFr(a.createdAt))}
        {row('Dernière connexion', a.lastLoginAt ? dateFr(a.lastLoginAt) : t('Jamais connecté'))}
        {row('Statut', a.disabledAt ? t('Suspendu') : t('Actif'))}
        {row('Boutiques actives', s.shops_active)}
        {row('Demandes en attente', s.shops_pending)}
        {row('Actions (7 jours)', s.actions7)}
        {row('Actions (total)', s.actions_total)}
      </dl>
      <div>
        <h3 className="mb-1 font-semibold">{t('Dernières actions')}</h3>
        {!recent.length ? <p className="text-zinc-500">{t('Aucune action enregistrée.')}</p> : (
          <ul className="max-h-56 space-y-1 overflow-y-auto text-xs">
            {recent.map((r) => <li key={r.id} className="flex justify-between gap-2"><span className="truncate">{actionLabel(r.method, r.path, t)}{r.status >= 400 ? ` ✕ ${r.status}` : ''}</span><span className="shrink-0 text-zinc-500">{dateFr(r.createdAt)}</span></li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

function Edit({ a, onDone }: { a: { id: string; name: string; email: string; country: string; phone: string; orzAccount: string | null }; onDone: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: a.name, email: a.email, country: a.country, phone: a.phone, orzAccount: a.orzAccount ?? '' });
  const save = useMutation({ mutationFn: () => unwrap(api.admin.admins[':id'].$patch({ param: { id: a.id }, json: f })), onSuccess: () => { qc.invalidateQueries({ queryKey: ['bo-admins'] }); qc.invalidateQueries({ queryKey: ['bo-admin', a.id] }); onDone(); } });
  return (
    <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <Err e={save.error} />
      <label className="text-xs text-zinc-400">{t('Nom')}<input className="input mt-1" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="text-xs text-zinc-400">{t('Email')}<input className="input mt-1" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
      <label className="text-xs text-zinc-400">{t('Pays géré')}<CountrySelect value={f.country} onChange={(v) => setF({ ...f, country: v })} /></label>
      <label className="text-xs text-zinc-400">{t('Téléphone du pays')}<input className="input mt-1" type="tel" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <label className="text-xs text-zinc-400">{t('N° de compte ORZAYAH du pays')}<input className="input mt-1" required minLength={3} maxLength={40} value={f.orzAccount} onChange={(e) => setF({ ...f, orzAccount: e.target.value })} /></label>
      <div className="flex gap-2 sm:col-span-3"><button className="btn" disabled={save.isPending}>{t('Enregistrer')}</button><button type="button" className="btn-ghost" onClick={onDone}>{t('Annuler')}</button></div>
    </form>
  );
}

/** Administrateurs pays : création, consultation détaillée, modification, suspension, mot de passe, suppression. Réservé à l'administrateur général. */
export function Admins() {
  const t = useT();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', email: '', password: '', country: 'CI', phone: '', orzAccount: '' });
  const [pw, setPw] = useState<{ id: string; value: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | null>(null);
  const list = useQuery({ queryKey: ['bo-admins'], queryFn: () => unwrap(api.admin.admins.$get()) });
  const inv = () => qc.invalidateQueries({ queryKey: ['bo-admins'] });
  const create = useMutation({ mutationFn: () => unwrap(api.admin.admins.$post({ json: f })), onSuccess: () => { inv(); setF({ name: '', email: '', password: '', country: f.country, phone: '', orzAccount: '' }); } });
  const reset = useMutation({ mutationFn: (v: { id: string; password: string }) => unwrap(api.admin.admins[':id'].password.$post({ param: { id: v.id }, json: { password: v.password } })), onSuccess: () => { setPw(null); alert(t('Mot de passe modifié.')); } });
  const toggle = useMutation({ mutationFn: (v: { id: string; disabled: boolean }) => unwrap(api.admin.admins[':id'].$patch({ param: { id: v.id }, json: { disabled: v.disabled } })), onSuccess: (_d, v) => { inv(); qc.invalidateQueries({ queryKey: ['bo-admin', v.id] }); } });
  const remove = useMutation({ mutationFn: (id: string) => unwrap(api.admin.admins[':id'].$delete({ param: { id } })), onSuccess: inv });
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };
  return (
    <div>
      <PageTitle title="Administrateurs pays" sub="Chaque administrateur pays ne gère que son pays : boutiques, paiements, publicités, mises en avant et avis. Vous gardez la vue sur tous les pays." />
      <Err e={list.error ?? create.error ?? reset.error ?? remove.error ?? toggle.error} />
      <form onSubmit={submit} className="card mb-6 grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{t('Nouvel administrateur pays')}</h2>
        <label className="text-xs text-zinc-400">{t('Nom')}<input className="input mt-1" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('Pays géré')}<CountrySelect value={f.country} onChange={(v) => setF({ ...f, country: v })} /></label>
        <label className="text-xs text-zinc-400">{t('Email')}<input className="input mt-1" type="email" required autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('Téléphone du pays')}<input className="input mt-1" type="tel" required placeholder="+225 07 00 00 00 00" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('N° de compte ORZAYAH du pays')}<input className="input mt-1" required minLength={3} maxLength={40} value={f.orzAccount} onChange={(e) => setF({ ...f, orzAccount: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('Mot de passe (8 caractères min.)')}<input className="input mt-1" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <div className="sm:col-span-2"><button className="btn" disabled={create.isPending}>{t('Créer le compte')}</button></div>
      </form>
      {list.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {list.data && !list.data.admins.length && <p className="text-zinc-400">{t('Aucun administrateur pays.')}</p>}
      <ul className="space-y-2">
        {list.data?.admins.map((a) => (
          <li key={a.id} className={`card !py-3 text-sm ${a.disabledAt ? 'opacity-70' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                <strong>{a.name}</strong> · {a.email} · <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">{cname(a.country)}</span>{' '}
                <span className={`rounded-full px-2 py-0.5 text-xs ${a.disabledAt ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{a.disabledAt ? t('Suspendu') : t('Actif')}</span>{' '}
                <span className="text-xs text-zinc-500">· {a.lastLoginAt ? `${t('Dernière connexion')} ${dateFr(a.lastLoginAt)}` : t('Jamais connecté')}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <button className="btn-ghost" aria-expanded={open === a.id} onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? t('Masquer') : t('Détails')}</button>
                <button className="btn-ghost" onClick={() => { setEdit(edit === a.id ? null : a.id); setOpen(a.id); }}>{t('Modifier')}</button>
                <button className="btn-ghost" disabled={toggle.isPending} onClick={() => (a.disabledAt || confirm(t('Suspendre le compte de {name} ? Il sera déconnecté immédiatement.', { name: a.name }))) && toggle.mutate({ id: a.id, disabled: !a.disabledAt })}>{a.disabledAt ? t('Réactiver') : t('Suspendre')}</button>
                <button className="btn-ghost" disabled={remove.isPending} onClick={() => confirm(t('Supprimer le compte de {name} ?', { name: a.name })) && remove.mutate(a.id)}>{t('Supprimer')}</button>
              </span>
            </div>
            {open === a.id && (
              <div className="mt-3 border-t border-zinc-800 pt-3">
                <Detail id={a.id} />
                {edit === a.id && <Edit a={a} onDone={() => setEdit(null)} />}
                <div className="mt-3">
                  {pw?.id === a.id ? (
                    <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); reset.mutate({ id: a.id, password: pw.value }); }}>
                      <input className="input !w-56" type="password" required minLength={8} autoFocus autoComplete="new-password" placeholder={t('Nouveau mot de passe')} value={pw.value} onChange={(e) => setPw({ id: a.id, value: e.target.value })} />
                      <button className="btn" disabled={reset.isPending}>{t('Enregistrer')}</button>
                      <button type="button" className="btn-ghost" onClick={() => setPw(null)}>{t('Annuler')}</button>
                    </form>
                  ) : <button className="btn-ghost" onClick={() => setPw({ id: a.id, value: '' })}>{t('Changer le mot de passe')}</button>}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Audit />
    </div>
  );
}

/** Journal d'audit central : qui a fait quoi, dans quel pays. */
function Audit() {
  const t = useT();
  const cname = useCountryName();
  const q = useQuery({ queryKey: ['bo-audit'], queryFn: () => unwrap(api.admin.audit.$get({ query: {} })) });
  return (
    <section className="mt-8">
      <h2 className="mb-2 font-semibold">{t("Journal d'audit")}</h2>
      <p className="mb-2 text-xs text-zinc-500">{t("Actions d'écriture de tous les administrateurs (100 dernières). Aucun mot de passe ni donnée saisie n'y figure.")}</p>
      {q.data && !q.data.audit.length && <p className="text-sm text-zinc-500">{t('Aucune action enregistrée.')}</p>}
      <ul className="card max-h-80 space-y-1 overflow-y-auto !p-3 text-xs">
        {q.data?.audit.map((r) => (
          <li key={r.id} className="flex flex-wrap justify-between gap-2"><span><strong>{r.userName || '—'}</strong> {r.country ? `(${cname(r.country)})` : `(${t('général')})`} · {actionLabel(r.method, r.path, t)}{r.status >= 400 ? ` ✕ ${r.status}` : ''}</span><span className="text-zinc-500">{dateFr(r.createdAt)}</span></li>
        ))}
      </ul>
    </section>
  );
}
