import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { useCountryName, useT } from '../../lib/i18n';
import { CountryChips, PageTitle, toIso, toLocal } from './ui';

type Item = { offerId: string; countries: string[]; startsAt: string | null; endsAt: string | null; rank: number; title: string; companyName: string; companyCountry: string; live: boolean; notVisible: boolean };

function Row({ f, onSave, onRemove, busy }: { f: Item; onSave: (v: { countries: string[]; startsAt: string | null; endsAt: string | null; rank: number }) => void; onRemove: () => void; busy: boolean }) {
  const t = useT();
  const cname = useCountryName();
  const [countries, setCountries] = useState(f.countries);
  const [from, setFrom] = useState(toLocal(f.startsAt));
  const [until, setUntil] = useState(toLocal(f.endsAt));
  const [rank, setRank] = useState(String(f.rank));
  return (
    <li className="card space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">⭐ {f.title}</p>
          <p className="text-xs text-zinc-500">{f.companyName} · {cname(f.companyCountry)}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${f.notVisible ? 'bg-red-500/15 text-red-300' : f.live ? 'bg-emerald-500/15 text-emerald-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
          {f.notVisible ? t('Offre non visible') : f.live ? t('Affichée') : t('Hors période')}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-zinc-400">{t('À partir du')}<input type="datetime-local" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t("Jusqu'au")}<input type="datetime-local" className="input mt-1" value={until} onChange={(e) => setUntil(e.target.value)} /></label>
        <label className="text-xs text-zinc-400">{t('Ordre (0 = en premier)')}<input type="number" min={0} max={999} className="input mt-1" value={rank} onChange={(e) => setRank(e.target.value)} /></label>
      </div>
      <div><p className="mb-1 text-xs text-zinc-400">{t('Visible pour les visiteurs de :')}</p><CountryChips value={countries} onChange={setCountries} /></div>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" disabled={busy} onClick={onRemove}>{t('Retirer de la une')}</button>
        <button className="btn" disabled={busy} onClick={() => onSave({ countries, startsAt: toIso(from), endsAt: toIso(until), rank: Number(rank) || 0 })}>{t('Enregistrer')}</button>
      </div>
    </li>
  );
}

/** Mise en avant : choisir les offres de la section « À la une » du site, par pays et par période. */
export function Featured() {
  const t = useT();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [term, setTerm] = useState('');
  const list = useQuery({ queryKey: ['bo-featured'], queryFn: () => unwrap(api.admin.featured.$get()) });
  const found = useQuery({ queryKey: ['bo-offer-search', term], enabled: term.trim().length >= 2, queryFn: () => unwrap(api.admin['offer-search'].$get({ query: { q: term.trim() } })) });
  const inv = () => { qc.invalidateQueries({ queryKey: ['bo-featured'] }); qc.invalidateQueries({ queryKey: ['bo-offer-search'] }); qc.invalidateQueries({ queryKey: ['featured'] }); };
  const save = useMutation({
    mutationFn: (v: { id: string; countries: string[]; startsAt: string | null; endsAt: string | null; rank: number }) => unwrap(api.admin.featured[':id'].$put({ param: { id: v.id }, json: { countries: v.countries, startsAt: v.startsAt, endsAt: v.endsAt, rank: v.rank } })),
    onSuccess: inv,
  });
  const remove = useMutation({ mutationFn: (id: string) => unwrap(api.admin.featured[':id'].$delete({ param: { id } })), onSuccess: inv });
  const items = (list.data?.featured ?? []) as unknown as Item[];

  return (
    <div>
      <PageTitle title="Mise en avant" sub="Les offres choisies ici apparaissent dans « À la une », en haut du catalogue, avec un badge. Vide = tous les pays, sans limite de date." />
      <Err e={list.error ?? save.error ?? remove.error ?? found.error} />
      <section className="card mb-6 space-y-3">
        <h2 className="font-semibold">{t('Ajouter une offre')}</h2>
        <input className="input" type="search" placeholder={t('Rechercher une offre ou un marchand (2 lettres minimum)')} aria-label={t('Rechercher une offre')} value={term} onChange={(e) => setTerm(e.target.value)} />
        {found.data && !found.data.offers.length && <p className="text-sm text-zinc-400">{t('Aucune offre en ligne ne correspond.')}</p>}
        <ul className="space-y-2">
          {found.data?.offers.map((o) => (
            <li key={String(o.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm">
              <span>{String(o.title)} <span className="text-xs text-zinc-500">· {String(o.companyName)} · {cname(String(o.companyCountry))} · {fcfa(Number(o.priceFcfa))}</span></span>
              {o.featured ? <span className="text-xs text-emerald-400">{t('déjà à la une')}</span> : <button className="btn !px-3 !py-1" disabled={save.isPending} onClick={() => save.mutate({ id: String(o.id), countries: [], startsAt: null, endsAt: null, rank: 0 })}>{t('Mettre à la une')}</button>}
            </li>
          ))}
        </ul>
      </section>
      <h2 className="mb-3 font-semibold">{t('À la une actuellement')} ({items.length})</h2>
      {!items.length && !list.isLoading && <p className="text-zinc-400">{t('Aucune offre à la une.')}</p>}
      <ul className="space-y-3">
        {items.map((f) => (
          <Row key={f.offerId + JSON.stringify([f.countries, f.startsAt, f.endsAt, f.rank])} f={f} busy={save.isPending || remove.isPending}
            onSave={(v) => save.mutate({ id: f.offerId, ...v })} onRemove={() => confirm(t('Retirer « {title} » de la une ?', { title: f.title })) && remove.mutate(f.offerId)} />
        ))}
      </ul>
    </div>
  );
}
