import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { useCountryName, useT } from '../../lib/i18n';
import { CREDIT_PRICE_FCFA } from '../../../shared/constants';
import { ACTIVITY_LABEL } from '../Home';
import { PageTitle } from './ui';

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Active', cls: 'bg-emerald-500/15 text-emerald-300' },
  pending: { label: 'En attente', cls: 'bg-amber-500/15 text-amber-300' },
  suspended: { label: 'Suspendue', cls: 'bg-red-500/15 text-red-300' },
  rejected: { label: 'Refusée', cls: 'bg-zinc-500/20 text-zinc-300' },
};

/** Boutiques regroupées par pays de création : filtres, chiffres, suspension / réactivation, crédits. */
export function Shops() {
  const t = useT();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const query = useQuery({
    queryKey: ['bo-partners', country, status, q],
    queryFn: () => unwrap(api.admin.partners.$get({ query: { ...(country ? { country } : {}), ...(status ? { status: status as 'active' } : {}), ...(q.trim() ? { q: q.trim() } : {}) } })),
  });
  const inv = () => { qc.invalidateQueries({ queryKey: ['bo-partners'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); qc.invalidateQueries({ queryKey: ['bo-kpis'] }); };
  const setSt = useMutation({ mutationFn: (v: { id: string; status: 'active' | 'suspended' }) => unwrap(api.admin.companies[':id'].status.$post({ param: { id: v.id }, json: { status: v.status } })), onSuccess: inv });
  const topup = useMutation({ mutationFn: (v: { id: string; credits: number }) => unwrap(api.admin.companies[':id'].credits.$post({ param: { id: v.id }, json: { credits: v.credits } })), onSuccess: inv });
  const d = query.data;
  const totalAll = d?.countries.reduce((a, c) => a + c.total, 0) ?? 0;

  return (
    <div>
      <PageTitle title="Boutiques" sub="Classées par pays de création. Un marchand est rattaché au pays où sa boutique a été créée." />
      <Err e={query.error ?? setSt.error ?? topup.error} />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label={t('Pays')}>
        <button role="tab" aria-selected={country === ''} onClick={() => setCountry('')} className={`rounded-full border px-3 py-1 text-sm ${country === '' ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{t('Tous')} ({totalAll})</button>
        {d?.countries.map((c) => (
          <button key={c.country} role="tab" aria-selected={country === c.country} onClick={() => setCountry(c.country)} className={`rounded-full border px-3 py-1 text-sm ${country === c.country ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>
            {cname(c.country)} ({c.total}){c.pending ? ` · ${t('{n} à valider', { n: c.pending })}` : ''}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input !w-64" type="search" placeholder={t('Rechercher (nom, ville, e-mail)')} aria-label={t('Rechercher une boutique')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label={t('Statut')} className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('Tous les statuts')}</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{t(v.label)}</option>)}
        </select>
      </div>
      {query.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {d && !d.partners.length && <p className="text-zinc-400">{t('Aucune boutique ne correspond.')}</p>}
      {d && d.partners.length > 0 && (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[920px] text-sm">
            <thead><tr className="text-left text-xs uppercase text-zinc-500">
              <th className="p-3">{t('Boutique')}</th><th className="p-3">{t('Pays')}</th><th className="p-3">{t('Statut')}</th><th className="p-3 text-right">{t('Offres')}</th><th className="p-3 text-right">{t('Réserv.')}</th><th className="p-3 text-right">{t('Ventes')}</th><th className="p-3">ORZAYAH</th><th className="p-3 text-right">{t('Crédits')}</th><th className="p-3 text-right">{t('Actions')}</th>
            </tr></thead>
            <tbody>
              {d.partners.map((p) => {
                const st = STATUS[p.status as string] ?? { label: String(p.status), cls: '' };
                return (
                  <tr key={String(p.id)} className="border-t border-white/5 align-top">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {p.logoUrl ? <img src={String(p.logoUrl)} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-xs font-bold">{String(p.name).slice(0, 2).toUpperCase()}</span>}
                        <div className="min-w-0">
                          <p className="font-medium">{String(p.name)}</p>
                          <p className="text-xs text-zinc-500">{t(ACTIVITY_LABEL[String(p.activity)] ?? String(p.activity))} · {String(p.city)}</p>
                          <p className="text-xs text-zinc-500">{String(p.ownerName)} · {String(p.ownerEmail)}</p>
                          <p className="text-xs text-zinc-600">{t('Créée le')} {dateFr(String(p.createdAt))}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{cname(String(p.country))}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{t(st.label)}</span></td>
                    <td className="p-3 text-right tabular-nums">{String(p.offersActive)}</td>
                    <td className="p-3 text-right tabular-nums">{String(p.bookings)}</td>
                    <td className="p-3 text-right tabular-nums">{fcfa(Number(p.gmv))}{Number(p.rating) > 0 && <span className="block text-xs text-zinc-500">★ {String(p.rating)}</span>}</td>
                    <td className="p-3">{p.orzConnected ? <span className="text-emerald-400">{t('✓ relié')}</span> : <span className="text-amber-400">{t('non relié')}</span>}</td>
                    <td className="p-3 text-right tabular-nums">{String(p.credits)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {p.status === 'active' && <a className="btn-ghost !px-2 !py-1 text-xs" target="_blank" rel="noreferrer" href={`https://www.backmarket-ci.com/boutique/${p.id}`}>{t('Voir')}</a>}
                        {p.status === 'pending' && <Link className="btn !px-2 !py-1 text-xs" to="/admin/demandes">{t('Traiter')}</Link>}
                        {p.status === 'active' && <button className="btn-ghost !px-2 !py-1 text-xs" disabled={setSt.isPending} onClick={() => confirm(t('Suspendre {name} ? Ses offres disparaîtront du site.', { name: String(p.name) })) && setSt.mutate({ id: String(p.id), status: 'suspended' })}>{t('Suspendre')}</button>}
                        {p.status === 'suspended' && <button className="btn !px-2 !py-1 text-xs" disabled={setSt.isPending} onClick={() => setSt.mutate({ id: String(p.id), status: 'active' })}>{t('Réactiver')}</button>}
                        {(p.status === 'active' || p.status === 'suspended') && (
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => {
                            const n = Number(prompt(t('Crédits à ajouter à {name} (1 crédit = {price}) :', { name: String(p.name), price: fcfa(CREDIT_PRICE_FCFA) })));
                            if (Number.isInteger(n) && n > 0) topup.mutate({ id: String(p.id), credits: n });
                          }}>{t('+ Crédits')}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
