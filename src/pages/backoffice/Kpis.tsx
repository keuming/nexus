import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { SalesChart } from '../../components/Charts';
import { useCountryName, useT } from '../../lib/i18n';
import { CountryFilter, Delta, Kpi, PageTitle } from './ui';

export function Kpis() {
  const t = useT();
  const cname = useCountryName();
  const [days, setDays] = useState(30);
  const [country, setCountry] = useState('');
  const q = useQuery({ queryKey: ['bo-kpis', days, country], queryFn: () => unwrap(api.admin.kpis.$get({ query: { days, ...(country ? { country } : {}) } })), refetchInterval: 60_000 });
  const k = q.data;
  const cur = k?.current, prev = k?.previous, tt = k?.totals;
  const basket = cur && cur.bookings ? Math.round(cur.gmv / cur.bookings) : 0;
  const basketPrev = prev && prev.bookings ? Math.round(prev.gmv / prev.bookings) : 0;
  const deliveredRate = cur && cur.bookings ? Math.round((cur.completed / cur.bookings) * 100) : 0;
  const ctr = tt && tt.ad_views ? ((tt.ad_clicks / tt.ad_views) * 100).toFixed(1) : '0';
  const todo = tt && [
    tt.partners_pending > 0 && { to: '/admin/demandes', text: t('{n} demande(s) de partenaire à valider', { n: tt.partners_pending }) },
    tt.needs_refund > 0 && { to: '/admin/paiements', text: t('{n} remboursement(s) à effectuer', { n: tt.needs_refund }) },
    tt.partners_without_orz > 0 && { to: '/admin/paiements', text: t("{n} partenaire(s) actif(s) n'ont pas relié leur compte ORZAYAH", { n: tt.partners_without_orz }) },
    tt.reviews_hidden > 0 && { to: '/admin/avis', text: t('{n} avis masqué(s)', { n: tt.reviews_hidden }) },
  ].filter(Boolean) as { to: string; text: string }[];

  return (
    <div>
      <PageTitle title="Tableau de bord" sub={t('Indicateurs des {days} derniers jours', { days }) + (country ? ' · ' + t('boutiques créées en {country}', { country: cname(country) }) : '')}>
        <CountryFilter value={country} onChange={setCountry} />
        <select aria-label={t('Période')} className="input !w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>{t('{n} jours', { n: d })}</option>)}
        </select>
      </PageTitle>
      <Err e={q.error} />
      {q.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {k && cur && prev && tt && (
        <div className="space-y-6">
          {todo && todo.length > 0 && (
            <section aria-label={t('À traiter')} className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
              <h2 className="mb-2 text-sm font-semibold text-amber-300">{t('À traiter')}</h2>
              <ul className="space-y-1 text-sm">{todo.map((a) => <li key={a.text}><Link className="text-amber-200 underline-offset-2 hover:underline" to={a.to}>{a.text} →</Link></li>)}</ul>
            </section>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Volume de ventes" value={fcfa(cur.gmv)} sub={<Delta cur={cur.gmv} prev={prev.gmv} />} />
            <Kpi label="Réservations" value={cur.bookings} sub={<Delta cur={cur.bookings} prev={prev.bookings} />} />
            <Kpi label="Panier moyen" value={fcfa(basket)} sub={<Delta cur={basket} prev={basketPrev} />} />
            <Kpi label="Payé en ligne (ORZAYAH)" value={fcfa(cur.online)} sub={<Delta cur={cur.online} prev={prev.online} />} />
            <Kpi label="Payé à la livraison" value={fcfa(cur.cash)} sub={<Delta cur={cur.cash} prev={prev.cash} />} />
            <Kpi label="Taux de livraison" value={`${deliveredRate} %`} sub={<span className="text-xs text-zinc-500">{t('{a} livrée(s) sur {b}', { a: cur.completed, b: cur.bookings })}</span>} />
            <Kpi label="Annulations" value={cur.cancelled} sub={<Delta cur={cur.cancelled} prev={prev.cancelled} />} />
            <Kpi label="Nouveaux clients" value={cur.newCustomers} sub={<Delta cur={cur.newCustomers} prev={prev.newCustomers} />} />
          </div>
          <section className="card">
            <h2 className="mb-3 font-semibold">{t('Ventes par jour')}</h2>
            <SalesChart data={k.series} />
          </section>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Partenaires actifs" value={tt.partners_active} sub={<span className="text-xs text-zinc-500">{t('{p} en attente · {s} suspendu(s) · +{n} sur la période', { p: tt.partners_pending, s: tt.partners_suspended, n: cur.newPartners })}</span>} />
            <Kpi label="Offres en ligne" value={tt.offers_active} />
            <Kpi label="Clients inscrits" value={tt.customers} />
            <Kpi label="Note moyenne" value={tt.rating_count ? `${tt.rating_avg} / 5` : '—'} sub={<span className="text-xs text-zinc-500">{t('{n} avis publié(s)', { n: tt.rating_count })}</span>} />
            <Kpi label="Publicités" value={`${tt.ad_views} ${t('vues')}`} sub={<span className="text-xs text-zinc-500">{t('{n} clic(s) · taux de clic {r} %', { n: tt.ad_clicks, r: ctr })}</span>} />
            <Kpi label="Remboursements à faire" value={tt.needs_refund} tone={tt.needs_refund ? 'warn' : undefined} />
            <Kpi label="Sans compte ORZAYAH" value={tt.partners_without_orz} tone={tt.partners_without_orz ? 'warn' : undefined} sub={<span className="text-xs text-zinc-500">{t('partenaires actifs')}</span>} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="card">
              <h2 className="mb-3 font-semibold">{t('Meilleurs partenaires')}</h2>
              {!k.topPartners.length ? <p className="text-sm text-zinc-400">{t('Aucune vente sur la période.')}</p> : (
                <ol className="space-y-2 text-sm">{k.topPartners.map((p, i) => <li key={p.id} className="flex justify-between gap-3"><span>{i + 1}. {p.name} <span className="text-xs text-zinc-500">({cname(p.country)})</span></span><span className="tabular-nums">{fcfa(p.gmv)} · {p.bookings}</span></li>)}</ol>
              )}
            </section>
            <section className="card">
              <h2 className="mb-3 font-semibold">{t('Meilleures offres')}</h2>
              {!k.topOffers.length ? <p className="text-sm text-zinc-400">{t('Aucune vente sur la période.')}</p> : (
                <ol className="space-y-2 text-sm">{k.topOffers.map((o, i) => <li key={o.id} className="flex justify-between gap-3"><span className="min-w-0 truncate">{i + 1}. {o.title} <span className="text-xs text-zinc-500">· {o.companyName}</span></span><span className="shrink-0 tabular-nums">{fcfa(o.gmv)} · {o.bookings}</span></li>)}</ol>
              )}
            </section>
          </div>
          <section className="card overflow-x-auto">
            <h2 className="mb-3 font-semibold">{t('Par pays de création des boutiques')}</h2>
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="text-left text-xs uppercase text-zinc-500"><th className="pb-2">{t('Pays')}</th><th className="pb-2 text-right">{t('Boutiques')}</th><th className="pb-2 text-right">{t('Offres')}</th><th className="pb-2 text-right">{t('Réservations')}</th><th className="pb-2 text-right">{t('Ventes')}</th></tr></thead>
              <tbody>{k.byCountry.map((r) => (
                <tr key={r.country} className="border-t border-white/5"><td className="py-2">{cname(r.country)}</td><td className="text-right tabular-nums">{r.shops}</td><td className="text-right tabular-nums">{r.offers}</td><td className="text-right tabular-nums">{r.bookings}</td><td className="text-right tabular-nums">{fcfa(r.gmv)}</td></tr>
              ))}</tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
