import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { useCountryName, useT } from '../../lib/i18n';
import { CountryFilter, Kpi, PageTitle } from './ui';

const PAY_FR: Record<string, string> = { pending: 'en attente', paid: 'payé', failed: 'échoué', expired: 'expiré', needs_refund: 'REMBOURSEMENT À FAIRE', refunded: 'remboursé' };

/**
 * Paiements des partenaires. L'argent des paiements en ligne arrive directement sur le compte ORZAYAH du marchand :
 * on suit ici ce qui est encaissé, en attente, dû à la livraison, et les remboursements à faire.
 */
export function PartnerPayments() {
  const tr = useT();
  const cname = useCountryName();
  const qc = useQueryClient();
  const [country, setCountry] = useState('');
  const [view, setView] = useState<'partners' | 'transactions'>('partners');
  const q = useQuery({ queryKey: ['bo-partner-payments', country], queryFn: () => unwrap(api.admin['partner-payments'].$get({ query: country ? { country } : {} })) });
  const pays = useQuery({ queryKey: ['admin-payments'], queryFn: () => unwrap(api.admin.payments.$get()), enabled: view === 'transactions' });
  const due = useQuery({ queryKey: ['admin-payouts'], queryFn: () => unwrap(api.admin.payouts.$get()) });
  const remind = useMutation({ mutationFn: (id: string) => unwrap(api.admin.partners[':id']['remind-orzayah'].$post({ param: { id } })), onSuccess: () => alert(tr('Rappel envoyé au partenaire.')) });
  const refunded = useMutation({ mutationFn: (id: string) => unwrap(api.admin.payments[':id'].refunded.$post({ param: { id } })), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-payments'] }); qc.invalidateQueries({ queryKey: ['bo-partner-payments'] }); qc.invalidateQueries({ queryKey: ['bo-kpis'] }); } });
  const reverse = useMutation({ mutationFn: (id: string) => unwrap(api.admin.companies[':id'].payouts.$post({ param: { id } })), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-payouts'] }); qc.invalidateQueries({ queryKey: ['bo-partner-payments'] }); } });
  const t = q.data?.totals;

  return (
    <div>
      <PageTitle title="Paiements des partenaires" sub="Chaque marchand reçoit les paiements en ligne sur son propre compte ORZAYAH. Ici, le suivi par partenaire.">
        <CountryFilter value={country} onChange={setCountry} />
      </PageTitle>
      <Err e={q.error ?? remind.error ?? refunded.error ?? reverse.error} />
      {t && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Encaissé en ligne" value={fcfa(t.onlinePaid)} sub={<span className="text-xs text-zinc-500">{tr('directement chez les marchands')}</span>} />
          <Kpi label="Paiements en attente" value={fcfa(t.onlinePending)} sub={<span className="text-xs text-zinc-500">{tr('liens ouverts, non payés')}</span>} />
          <Kpi label="À encaisser à la livraison" value={fcfa(t.cashDue)} sub={<span className="text-xs text-zinc-500">{tr('encaissé')} : {fcfa(t.cashCollected)}</span>} />
          <Kpi label="Remboursements à faire" value={t.refundsDue} tone={t.refundsDue ? 'warn' : undefined} sub={<span className="text-xs text-zinc-500">{tr('{n} partenaire(s) sans compte ORZAYAH', { n: t.notConnected })}</span>} />
        </div>
      )}
      <div className="mb-4 flex gap-2" role="tablist">
        {([['partners', 'Par partenaire'], ['transactions', 'Transactions']] as const).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)} className={`rounded-full border px-3 py-1 text-sm ${view === id ? 'border-brand bg-brand text-black' : 'border-white/15 text-zinc-300 hover:bg-white/5'}`}>{tr(label)}</button>
        ))}
      </div>

      {view === 'partners' && (
        <>
          {q.isLoading && <p className="text-zinc-400">{tr('Chargement…')}</p>}
          {q.data && !q.data.partners.length && <p className="text-zinc-400">{tr('Aucun partenaire actif.')}</p>}
          {q.data && q.data.partners.length > 0 && (
            <div className="card overflow-x-auto !p-0">
              <table className="w-full min-w-[860px] text-sm">
                <thead><tr className="text-left text-xs uppercase text-zinc-500">
                  <th className="p-3">{tr('Partenaire')}</th><th className="p-3">{tr('Compte ORZAYAH')}</th><th className="p-3 text-right">{tr('Payé en ligne')}</th><th className="p-3 text-right">{tr('En attente')}</th><th className="p-3 text-right">{tr('À la livraison')}</th><th className="p-3 text-right">{tr('Remb.')}</th><th className="p-3 text-right">{tr('Action')}</th>
                </tr></thead>
                <tbody>
                  {q.data.partners.map((p) => (
                    <tr key={String(p.id)} className="border-t border-white/5 align-top">
                      <td className="p-3"><p className="font-medium">{String(p.name)}</p><p className="text-xs text-zinc-500">{cname(String(p.country))}{p.status === 'suspended' ? ` · ${tr('suspendue')}` : ''}</p></td>
                      <td className="p-3">{p.orzConnected ? <><span className="text-emerald-400">{tr('✓ relié')}</span>{!p.webhookConfigured && <span className="block text-xs text-amber-400">{tr('webhook non configuré')}</span>}</> : <span className="text-amber-400">{tr('non relié')}</span>}</td>
                      <td className="p-3 text-right tabular-nums">{fcfa(Number(p.onlinePaid))}</td>
                      <td className="p-3 text-right tabular-nums">{fcfa(Number(p.onlinePending))}</td>
                      <td className="p-3 text-right tabular-nums">{fcfa(Number(p.cashDue))}<span className="block text-xs text-zinc-500">{tr('encaissé')} {fcfa(Number(p.cashCollected))}</span></td>
                      <td className={`p-3 text-right tabular-nums ${Number(p.refundsDue) ? 'font-semibold text-amber-400' : ''}`}>{String(p.refundsDue)}</td>
                      <td className="p-3 text-right">{!p.orzConnected && <button className="btn-ghost !px-2 !py-1 text-xs" disabled={remind.isPending} onClick={() => remind.mutate(String(p.id))}>{tr('Rappeler')}</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {due.data && due.data.payouts.length > 0 && (
            <section className="mt-8 space-y-2">
              <h2 className="font-semibold">{tr('Anciens paiements à reverser (avant le paiement direct)')}</h2>
              <ul className="space-y-2">{due.data.payouts.map((r) => (
                <li key={r.companyId} className="card flex flex-wrap items-center justify-between gap-3 !py-3 text-sm">
                  <span><strong>{r.companyName}</strong> · {tr('{n} paiement(s)', { n: r.count })} · {fcfa(r.totalFcfa)}</span>
                  <button className="btn-ghost" disabled={reverse.isPending} onClick={() => confirm(tr('Confirmer que {amount} ont été reversés à {name} ?', { amount: fcfa(r.totalFcfa), name: r.companyName })) && reverse.mutate(r.companyId)}>{tr('Marquer reversé')}</button>
                </li>
              ))}</ul>
            </section>
          )}
        </>
      )}

      {view === 'transactions' && (
        <>
          {pays.isLoading && <p className="text-zinc-400">{tr('Chargement…')}</p>}
          {pays.data && !pays.data.payments.length && <p className="text-zinc-400">{tr('Aucune transaction.')}</p>}
          <ul className="space-y-2">
            {pays.data?.payments.map((p) => (
              <li key={p.id} className={`card flex flex-wrap items-center justify-between gap-2 !py-3 text-sm ${p.status === 'needs_refund' ? 'border-amber-500' : ''}`}>
                <span>
                  <strong className={p.status === 'needs_refund' ? 'text-amber-400' : ''}>{tr(PAY_FR[p.status] ?? p.status)}</strong> · {fcfa(p.amountFcfa)} · {p.customerName} → {p.companyName} · {dateFr(p.createdAt)}
                  {p.orzRef && <span className="text-zinc-500"> · {tr('réf.')} {p.orzRef}</span>}
                  {p.failureReason && <em className="block text-zinc-500">{p.failureReason}</em>}
                </span>
                {p.status === 'needs_refund' && <button className="btn-ghost" disabled={refunded.isPending} onClick={() => confirm(tr('Confirmer que le client a bien été remboursé ?')) && refunded.mutate(p.id)}>{tr('Marquer remboursé')}</button>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
