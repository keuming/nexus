import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { CountrySelect } from '../../components/ChipInput';
import { useCountryName, useT } from '../../lib/i18n';
import { PageTitle } from './ui';

/** Administrateurs pays : chacun ne voit et ne gère que les boutiques, paiements, publicités et avis de son pays. Réservé à l'administrateur général. */
export function Admins() {
  const t = useT();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: '', email: '', password: '', country: 'CI' });
  const [pw, setPw] = useState<{ id: string; value: string } | null>(null);
  const list = useQuery({ queryKey: ['bo-admins'], queryFn: () => unwrap(api.admin.admins.$get()) });
  const inv = () => qc.invalidateQueries({ queryKey: ['bo-admins'] });
  const create = useMutation({ mutationFn: () => unwrap(api.admin.admins.$post({ json: f })), onSuccess: () => { inv(); setF({ name: '', email: '', password: '', country: f.country }); } });
  const reset = useMutation({ mutationFn: (v: { id: string; password: string }) => unwrap(api.admin.admins[':id'].password.$post({ param: { id: v.id }, json: { password: v.password } })), onSuccess: () => { setPw(null); alert(t('Mot de passe modifié.')); } });
  const remove = useMutation({ mutationFn: (id: string) => unwrap(api.admin.admins[':id'].$delete({ param: { id } })), onSuccess: inv });
  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate(); };
  return (
    <div>
      <PageTitle title="Administrateurs pays" sub="Chaque administrateur pays ne gère que son pays : boutiques, paiements, publicités, mises en avant et avis. Vous gardez la vue sur tous les pays." />
      <Err e={list.error ?? create.error ?? reset.error ?? remove.error} />
      <form onSubmit={submit} className="card mb-6 grid gap-3 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">{t('Nouvel administrateur pays')}</h2>
        <label className="text-xs text-zinc-400">{t('Nom')}<input className="input mt-1" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('Pays géré')}<CountrySelect value={f.country} onChange={(v) => setF({ ...f, country: v })} /></label>
        <label className="text-xs text-zinc-400">{t('Email')}<input className="input mt-1" type="email" required autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="text-xs text-zinc-400">{t('Mot de passe (8 caractères min.)')}<input className="input mt-1" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
        <div className="sm:col-span-2"><button className="btn" disabled={create.isPending}>{t('Créer le compte')}</button></div>
      </form>
      {list.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {list.data && !list.data.admins.length && <p className="text-zinc-400">{t('Aucun administrateur pays.')}</p>}
      <ul className="space-y-2">
        {list.data?.admins.map((a) => (
          <li key={a.id} className="card flex flex-wrap items-center justify-between gap-3 !py-3 text-sm">
            <span><strong>{a.name}</strong> · {a.email} · <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs text-brand">{a.country ? cname(a.country) : ''}</span> <span className="text-xs text-zinc-500">· {dateFr(a.createdAt)}</span></span>
            <span className="flex flex-wrap gap-2">
              {pw?.id === a.id ? (
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); reset.mutate({ id: a.id, password: pw.value }); }}>
                  <input className="input !w-48" type="password" required minLength={8} autoFocus autoComplete="new-password" placeholder={t('Nouveau mot de passe')} value={pw.value} onChange={(e) => setPw({ id: a.id, value: e.target.value })} />
                  <button className="btn" disabled={reset.isPending}>{t('Enregistrer')}</button>
                  <button type="button" className="btn-ghost" onClick={() => setPw(null)}>{t('Annuler')}</button>
                </form>
              ) : <button className="btn-ghost" onClick={() => setPw({ id: a.id, value: '' })}>{t('Changer le mot de passe')}</button>}
              <button className="btn-ghost" disabled={remove.isPending} onClick={() => confirm(t('Supprimer le compte de {name} ?', { name: a.name })) && remove.mutate(a.id)}>{t('Supprimer')}</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
