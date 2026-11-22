import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { compress, upload } from '../../components/PhotoPicker';
import { useCountryName, useI18n, useT } from '../../lib/i18n';
import { CountryChips, PageTitle, toIso, toLocal } from './ui';

const SLOTS = { home_top: 'Bandeau en haut du catalogue', home_inline: 'Carte parmi les offres' } as const;
type Slot = keyof typeof SLOTS;
interface Draft { advertiser: string; title: string; body: string; imageUrl: string | null; linkUrl: string; ctaLabel: string; slot: Slot; countries: string[]; active: boolean; from: string; until: string }
const empty: Draft = { advertiser: 'gaRAN', title: '', body: '', imageUrl: null, linkUrl: 'https://', ctaLabel: 'Découvrir', slot: 'home_top', countries: [], active: true, from: '', until: '' };

function AdForm({ initial, onSubmit, onCancel, pending, label }: { initial: Draft; onSubmit: (d: Draft) => void; onCancel?: () => void; pending: boolean; label: string }) {
  const t = useT();
  const [d, setD] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = useQuery({ queryKey: ['bo-upload-config'], queryFn: () => unwrap(api.admin['upload-config'].$get()), staleTime: Infinity });
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(''); setBusy(true);
    try {
      if (!cfg.data?.cloudinary) throw new Error(t("L'envoi d'images n'est pas configuré (Cloudinary)"));
      set('imageUrl', await upload(cfg.data.cloudinary, await compress(file, 1200)));
    } catch (e) { setErr(e instanceof Error ? e.message : t("Échec de l'envoi")); } finally { setBusy(false); }
  };
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(d); };
  return (
    <form onSubmit={submit} className="card space-y-3">
      <Err e={err ? new Error(err) : null} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-400">{t('Annonceur')}<input className="input mt-1" required minLength={2} maxLength={80} value={d.advertiser} onChange={(e) => set('advertiser', e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Emplacement')}<select className="input mt-1" value={d.slot} onChange={(e) => set('slot', e.target.value as Slot)}>{Object.entries(SLOTS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}</select></label>
        <label className="text-xs text-zinc-400 sm:col-span-2">{t('Titre')}<input className="input mt-1" required minLength={3} maxLength={90} value={d.title} onChange={(e) => set('title', e.target.value)} placeholder="gaRAN : le registre IMEI de votre boutique" /></label>
        <label className="text-xs text-zinc-400 sm:col-span-2">{t('Texte (facultatif)')}<textarea className="input mt-1" maxLength={240} rows={2} value={d.body} onChange={(e) => set('body', e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Lien (https://… ou /chemin)')}<input className="input mt-1" required maxLength={500} value={d.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Texte du bouton')}<input className="input mt-1" required minLength={2} maxLength={30} value={d.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Début de diffusion')}<input type="datetime-local" className="input mt-1" value={d.from} onChange={(e) => set('from', e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Fin de diffusion')}<input type="datetime-local" className="input mt-1" value={d.until} onChange={(e) => set('until', e.target.value)} /></label>
      </div>
      <div>
        <p className="mb-1 text-xs text-zinc-400">{t('Image (bandeau : format large 3:1 conseillé)')}</p>
        <div className="flex flex-wrap items-center gap-3">
          {d.imageUrl && <img src={d.imageUrl} alt="Aperçu de l'image" className="h-16 w-40 rounded-lg object-cover" />}
          <label className="btn-ghost cursor-pointer">{busy ? t('Envoi…') : d.imageUrl ? t("Changer l'image") : t('Choisir une image')}<input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={(e) => pick(e.target.files?.[0])} /></label>
          {d.imageUrl && <button type="button" className="btn-ghost" onClick={() => set('imageUrl', null)}>{t('Retirer')}</button>}
        </div>
      </div>
      <div><p className="mb-1 text-xs text-zinc-400">{t('Diffusée dans les pays :')}</p><CountryChips value={d.countries} onChange={(v) => set('countries', v)} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} /> {t('Diffusion active')}</label>
      <div className="flex justify-end gap-2">
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>{t('Annuler')}</button>}
        <button className="btn" disabled={pending || busy}>{label}</button>
      </div>
    </form>
  );
}

const body = (d: Draft) => ({ advertiser: d.advertiser, title: d.title, body: d.body, imageUrl: d.imageUrl, linkUrl: d.linkUrl, ctaLabel: d.ctaLabel, slot: d.slot, countries: d.countries, active: d.active, startsAt: toIso(d.from), endsAt: toIso(d.until) });

/** Publicités des partenaires (dont gaRAN) sur la vitrine, ciblées par pays et par période, avec vues et clics. */
export function Ads() {
  const t = useT();
  const { lang } = useI18n();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const q = useQuery({ queryKey: ['bo-ads'], queryFn: () => unwrap(api.admin.ads.$get()) });
  const inv = () => { qc.invalidateQueries({ queryKey: ['bo-ads'] }); qc.invalidateQueries({ queryKey: ['ads'] }); qc.invalidateQueries({ queryKey: ['bo-kpis'] }); };
  const create = useMutation({ mutationFn: (d: Draft) => unwrap(api.admin.ads.$post({ json: body(d) })), onSuccess: () => { inv(); setCreating(false); } });
  const update = useMutation({ mutationFn: (v: { id: string; d: Draft }) => unwrap(api.admin.ads[':id'].$patch({ param: { id: v.id }, json: body(v.d) })), onSuccess: () => { inv(); setEditing(null); } });
  const toggle = useMutation({ mutationFn: (v: { id: string; active: boolean }) => unwrap(api.admin.ads[':id'].$patch({ param: { id: v.id }, json: { active: v.active } })), onSuccess: inv });
  const remove = useMutation({ mutationFn: (id: string) => unwrap(api.admin.ads[':id'].$delete({ param: { id } })), onSuccess: inv });

  return (
    <div>
      <PageTitle title="Publicités" sub="Affichez les annonces de vos partenaires (dont gaRAN) sur le site, dans les pays et aux dates de votre choix.">
        {!creating && <button className="btn" onClick={() => setCreating(true)}>{t('+ Nouvelle publicité')}</button>}
      </PageTitle>
      <Err e={q.error ?? create.error ?? update.error ?? toggle.error ?? remove.error} />
      {creating && <div className="mb-6"><AdForm initial={empty} label={t('Créer la publicité')} pending={create.isPending} onSubmit={(d) => create.mutate(d)} onCancel={() => setCreating(false)} /></div>}
      {q.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {q.data && !q.data.ads.length && !creating && <p className="text-zinc-400">{t('Aucune publicité. Créez la première (ex. gaRAN).')}</p>}
      <ul className="space-y-3">
        {q.data?.ads.map((a) => {
          const ctr = a.views ? ((a.clicks / a.views) * 100).toFixed(1) : '0';
          if (editing === a.id) return (
            <li key={a.id}><AdForm label={t('Enregistrer')} pending={update.isPending} onCancel={() => setEditing(null)} onSubmit={(d) => update.mutate({ id: a.id, d })}
              initial={{ advertiser: a.advertiser, title: a.title, body: a.body, imageUrl: a.imageUrl, linkUrl: a.linkUrl, ctaLabel: a.ctaLabel, slot: a.slot as Slot, countries: a.countries, active: a.active, from: toLocal(a.startsAt as unknown as string | null), until: toLocal(a.endsAt as unknown as string | null) }} /></li>
          );
          return (
            <li key={a.id} className="card flex flex-wrap items-start gap-4">
              {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-20 w-48 rounded-lg object-cover" /> : <div className="grid h-20 w-48 place-items-center rounded-lg bg-white/5 text-xs text-zinc-500">{t('Sans image')}</div>}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{a.title} <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${a.live ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'}`}>{a.live ? t('En diffusion') : a.active ? t('Hors période') : t('En pause')}</span></p>
                <p className="text-xs text-zinc-500">{a.advertiser} · {t(SLOTS[a.slot as Slot] ?? a.slot)} · {a.countries.length ? a.countries.map(cname).join(', ') : t('tous les pays')}</p>
                <p className="text-xs text-zinc-500">{a.startsAt ? `${t('du')} ${new Date(a.startsAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')} ` : ''}{a.endsAt ? `${t('au')} ${new Date(a.endsAt).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR')}` : a.startsAt ? '' : t('sans limite de date')}</p>
                <p className="text-sm"><strong className="tabular-nums">{a.views}</strong> {t('vues')} · <strong className="tabular-nums">{a.clicks}</strong> {t('clics')} · {t('taux de clic')} <strong>{ctr} %</strong></p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: a.id, active: !a.active })}>{a.active ? t('Mettre en pause') : t('Activer')}</button>
                <button className="btn-ghost" onClick={() => setEditing(a.id)}>{t('Modifier')}</button>
                <button className="btn-ghost" disabled={remove.isPending} onClick={() => confirm(t('Supprimer « {title} » ?', { title: a.title })) && remove.mutate(a.id)}>{t('Supprimer')}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
