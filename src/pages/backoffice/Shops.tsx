import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, dateFr, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { countryName } from '../../../shared/geo';
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
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Pays">
        <button role="tab" aria-selected={country === ''} onClick={() => setCountry('')} className={`rounded-full border px-3 py-1 text-sm ${country === '' ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>Tous ({totalAll})</button>
        {d?.countries.map((c) => (
          <button key={c.country} role="tab" aria-selected={country === c.country} onClick={() => setCountry(c.country)} className={`rounded-full border px-3 py-1 text-sm ${country === c.country ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>
            {countryName(c.country)} ({c.total}){c.pending ? ` · ${c.pending} à valider` : ''}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input className="input !w-64" type="search" placeholder="Rechercher (nom, ville, e-mail)" aria-label="Rechercher une boutique" value={q} onChange={(e) => setQ(e.target.value)} />
        <select aria-label="Statut" className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {query.isLoading && <p className="text-zinc-400">Chargement…</p>}
      {d && !d.partners.length && <p className="text-zinc-400">Aucune boutique ne correspond.</p>}
      {d && d.partners.length > 0 && (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full min-w-[920px] text-sm">
            <thead><tr className="text-left text-xs uppercase text-zinc-500">
              <th className="p-3">Boutique</th><th className="p-3">Pays</th><th className="p-3">Statut</th><th className="p-3 text-right">Offres</th><th className="p-3 text-right">Réserv.</th><th className="p-3 text-right">Ventes</th><th className="p-3">ORZAYAH</th><th className="p-3 text-right">Crédits</th><th className="p-3 text-right">Actions</th>
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
                          <p className="text-xs text-zinc-500">{ACTIVITY_LABEL[String(p.activity)] ?? String(p.activity)} · {String(p.city)}</p>
                          <p className="text-xs text-zinc-500">{String(p.ownerName)} · {String(p.ownerEmail)}</p>
                          <p className="text-xs text-zinc-600">Créée le {dateFr(String(p.createdAt))}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{countryName(String(p.country))}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span></td>
                    <td className="p-3 text-right tabular-nums">{String(p.offersActive)}</td>
                    <td className="p-3 text-right tabular-nums">{String(p.bookings)}</td>
                    <td className="p-3 text-right tabular-nums">{fcfa(Number(p.gmv))}{Number(p.rating) > 0 && <span className="block text-xs text-zinc-500">★ {String(p.rating)}</span>}</td>
                    <td className="p-3">{p.orzConnected ? <span className="text-emerald-400">✓ relié</span> : <span className="text-amber-400">non relié</span>}</td>
                    <td className="p-3 text-right tabular-nums">{String(p.credits)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {p.status === 'active' && <a className="btn-ghost !px-2 !py-1 text-xs" target="_blank" rel="noreferrer" href={`https://www.backmarket-ci.com/boutique/${p.id}`}>Voir</a>}
                        {p.status === 'pending' && <Link className="btn !px-2 !py-1 text-xs" to="/admin/demandes">Traiter</Link>}
                        {p.status === 'active' && <button className="btn-ghost !px-2 !py-1 text-xs" disabled={setSt.isPending} onClick={() => confirm(`Suspendre ${p.name} ? Ses offres disparaîtront du site.`) && setSt.mutate({ id: String(p.id), status: 'suspended' })}>Suspendre</button>}
                        {p.status === 'suspended' && <button className="btn !px-2 !py-1 text-xs" disabled={setSt.isPending} onClick={() => setSt.mutate({ id: String(p.id), status: 'active' })}>Réactiver</button>}
                        {(p.status === 'active' || p.status === 'suspended') && (
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => {
                            const n = Number(prompt(`Crédits à ajouter à ${p.name} (1 crédit = ${fcfa(CREDIT_PRICE_FCFA)}) :`));
                            if (Number.isInteger(n) && n > 0) topup.mutate({ id: String(p.id), credits: n });
                          }}>+ Crédits</button>
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
