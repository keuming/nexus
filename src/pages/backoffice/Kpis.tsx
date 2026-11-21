import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { SalesChart } from '../../components/Charts';
import { countryName } from '../../../shared/geo';
import { CountryFilter, Delta, Kpi, PageTitle } from './ui';

export function Kpis() {
  const [days, setDays] = useState(30);
  const [country, setCountry] = useState('');
  const q = useQuery({ queryKey: ['bo-kpis', days, country], queryFn: () => unwrap(api.admin.kpis.$get({ query: { days, ...(country ? { country } : {}) } })), refetchInterval: 60_000 });
  const k = q.data;
  const cur = k?.current, prev = k?.previous, t = k?.totals;
  const basket = cur && cur.bookings ? Math.round(cur.gmv / cur.bookings) : 0;
  const basketPrev = prev && prev.bookings ? Math.round(prev.gmv / prev.bookings) : 0;
  const deliveredRate = cur && cur.bookings ? Math.round((cur.completed / cur.bookings) * 100) : 0;
  const ctr = t && t.ad_views ? ((t.ad_clicks / t.ad_views) * 100).toFixed(1) : '0';
  const todo = t && [
    t.partners_pending > 0 && { to: '/admin/demandes', text: `${t.partners_pending} demande(s) de partenaire à valider` },
    t.needs_refund > 0 && { to: '/admin/paiements', text: `${t.needs_refund} remboursement(s) à effectuer` },
    t.partners_without_orz > 0 && { to: '/admin/paiements', text: `${t.partners_without_orz} partenaire(s) actif(s) n'ont pas relié leur compte ORZAYAH` },
    t.reviews_hidden > 0 && { to: '/admin/avis', text: `${t.reviews_hidden} avis masqué(s)` },
  ].filter(Boolean) as { to: string; text: string }[];

  return (
    <div>
      <PageTitle title="Tableau de bord" sub={`Indicateurs des ${days} derniers jours${country ? ` · boutiques créées en ${countryName(country)}` : ' · tous pays'}`}>
        <CountryFilter value={country} onChange={setCountry} />
        <select aria-label="Période" className="input !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>{d} jours</option>)}
        </select>
      </PageTitle>
      <Err e={q.error} />
      {q.isLoading && <p className="text-zinc-400">Chargement…</p>}
      {k && cur && prev && t && (
        <div className="space-y-6">
          {todo && todo.length > 0 && (
            <section aria-label="À traiter" className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
              <h2 className="mb-2 text-sm font-semibold text-amber-300">À traiter</h2>
              <ul className="space-y-1 text-sm">{todo.map((a) => <li key={a.text}><Link className="text-amber-200 underline-offset-2 hover:underline" to={a.to}>{a.text} →</Link></li>)}</ul>
            </section>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Volume de ventes" value={fcfa(cur.gmv)} sub={<Delta cur={cur.gmv} prev={prev.gmv} />} />
            <Kpi label="Réservations" value={cur.bookings} sub={<Delta cur={cur.bookings} prev={prev.bookings} />} />
            <Kpi label="Panier moyen" value={fcfa(basket)} sub={<Delta cur={basket} prev={basketPrev} />} />
            <Kpi label="Payé en ligne (ORZAYAH)" value={fcfa(cur.online)} sub={<Delta cur={cur.online} prev={prev.online} />} />
            <Kpi label="Payé à la livraison" value={fcfa(cur.cash)} sub={<Delta cur={cur.cash} prev={prev.cash} />} />
            <Kpi label="Taux de livraison" value={`${deliveredRate} %`} sub={<span className="text-xs text-zinc-500">{cur.completed} livrée(s) sur {cur.bookings}</span>} />
            <Kpi label="Annulations" value={cur.cancelled} sub={<Delta cur={cur.cancelled} prev={prev.cancelled} />} />
            <Kpi label="Nouveaux clients" value={cur.newCustomers} sub={<Delta cur={cur.newCustomers} prev={prev.newCustomers} />} />
          </div>
          <section className="card">
            <h2 className="mb-3 font-semibold">Ventes par jour</h2>
            <SalesChart data={k.series} />
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Partenaires actifs" value={t.partners_active} sub={<span className="text-xs text-zinc-500">{t.partners_pending} en attente · {t.partners_suspended} suspendu(s) · +{cur.newPartners} sur la période</span>} />
            <Kpi label="Offres en ligne" value={t.offers_active} />
            <Kpi label="Clients inscrits" value={t.customers} />
            <Kpi label="Note moyenne" value={t.rating_count ? `${t.rating_avg} / 5` : '—'} sub={<span className="text-xs text-zinc-500">{t.rating_count} avis publié(s)</span>} />
            <Kpi label="Publicités" value={`${t.ad_views} vues`} sub={<span className="text-xs text-zinc-500">{t.ad_clicks} clic(s) · taux de clic {ctr} %</span>} />
            <Kpi label="Remboursements à faire" value={t.needs_refund} tone={t.needs_refund ? 'warn' : undefined} />
            <Kpi label="Sans compte ORZAYAH" value={t.partners_without_orz} tone={t.partners_without_orz ? 'warn' : undefined} sub={<span className="text-xs text-zinc-500">partenaires actifs</span>} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="card">
              <h2 className="mb-3 font-semibold">Meilleurs partenaires</h2>
              {!k.topPartners.length ? <p className="text-sm text-zinc-400">Aucune vente sur la période.</p> : (
                <ol className="space-y-2 text-sm">{k.topPartners.map((p, i) => <li key={p.id} className="flex justify-between gap-3"><span>{i + 1}. {p.name} <span className="text-xs text-zinc-500">({countryName(p.country)})</span></span><span className="tabular-nums">{fcfa(p.gmv)} · {p.bookings}</span></li>)}</ol>
              )}
            </section>
            <section className="card">
              <h2 className="mb-3 font-semibold">Meilleures offres</h2>
              {!k.topOffers.length ? <p className="text-sm text-zinc-400">Aucune vente sur la période.</p> : (
                <ol className="space-y-2 text-sm">{k.topOffers.map((o, i) => <li key={o.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{i + 1}. {o.title} <span className="text-xs text-zinc-500">· {o.companyName}</span></span><span className="shrink-0 tabular-nums">{fcfa(o.gmv)} · {o.bookings}</span></li>)}</ol>
              )}
            </section>
          </div>
          <section className="card overflow-x-auto">
            <h2 className="mb-3 font-semibold">Par pays de création des boutiques</h2>
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="text-left text-xs uppercase text-zinc-500"><th className="pb-2">Pays</th><th className="pb-2 text-right">Boutiques</th><th className="pb-2 text-right">Offres</th><th className="pb-2 text-right">Réservations</th><th className="pb-2 text-right">Ventes</th></tr></thead>
              <tbody>{k.byCountry.map((r) => (
                <tr key={r.country} className="border-t border-white/5"><td className="py-2">{countryName(r.country)}</td><td className="text-right tabular-nums">{r.shops}</td><td className="text-right tabular-nums">{r.offers}</td><td className="text-right tabular-nums">{r.bookings}</td><td className="text-right tabular-nums">{fcfa(r.gmv)}</td></tr>
              ))}</tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
