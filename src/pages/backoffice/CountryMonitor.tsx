import { useQuery } from '@tanstack/react-query';
import { api, dateFr, fcfa, unwrap } from '../../lib/api';
import { Err } from '../../components/Layout';
import { useCountryName, useT } from '../../lib/i18n';
import { PageTitle } from './ui';

const STATE = {
  active: { label: 'Actif', cls: 'bg-emerald-500/15 text-emerald-300' },
  quiet: { label: 'Calme', cls: 'bg-amber-500/15 text-amber-300' },
  inactive: { label: 'Inactif', cls: 'bg-zinc-500/20 text-zinc-300' },
} as const;
const ALERT: Record<string, string> = {
  no_admin: 'Aucun administrateur actif',
  late_requests: 'Demandes en attente depuis plus de 48 h',
  refunds_due: 'Remboursements à effectuer',
  high_cancellations: 'Annulations élevées (30 j)',
  admin_never_logged: "L'administrateur ne s'est jamais connecté",
  admin_inactive: "Administrateur sans connexion depuis 14 j",
};

/** Suivi de l'activité de la vitrine de chaque pays (activité commerciale et d'administration — pas de mesure de visites). */
export function CountryMonitor() {
  const t = useT();
  const cname = useCountryName();
  const q = useQuery({ queryKey: ['bo-countries-activity'], queryFn: () => unwrap(api.admin['countries-activity'].$get()), refetchInterval: 60_000 });
  return (
    <div>
      <PageTitle title="Suivi des pays" sub="État de la vitrine de chaque pays : boutiques, offres, réservations et alertes. Actif = au moins une vente sur 7 jours ; Calme = boutiques actives sans vente récente ; Inactif = aucune boutique active." />
      <Err e={q.error} />
      {q.isLoading && <p className="text-zinc-400">{t('Chargement…')}</p>}
      {q.data && !q.data.countries.length && <p className="text-zinc-400">{t('Aucun pays actif pour le moment.')}</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {q.data?.countries.map((c) => (
          <article key={c.country} className="card text-sm">
            <header className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-semibold">{cname(c.country)}</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${STATE[c.state].cls}`}>{t(STATE[c.state].label)}</span>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              <dt className="text-zinc-400">{t('Boutiques actives')}</dt><dd className="text-right">{c.shopsActive}{c.shopsPending ? ` (+${c.shopsPending} ${t('en attente')})` : ''}</dd>
              <dt className="text-zinc-400">{t('Offres en ligne')}</dt><dd className="text-right">{c.offersLive}</dd>
              <dt className="text-zinc-400">{t('Réservations 24 h / 7 j / 30 j')}</dt><dd className="text-right">{c.bookings24h} / {c.bookings7d} / {c.bookings30d}</dd>
              <dt className="text-zinc-400">{t('Ventes 7 j')}</dt><dd className="text-right">{fcfa(c.gmv7d)}</dd>
              <dt className="text-zinc-400">{t('Dernière réservation')}</dt><dd className="text-right">{c.lastBookingAt ? dateFr(c.lastBookingAt) : '—'}</dd>
              <dt className="text-zinc-400">{t('Publicités en cours')}</dt><dd className="text-right">{c.adsLive}</dd>
              <dt className="text-zinc-400">{t('Administrateur pays')}</dt><dd className="text-right">{c.adminsEnabled ? `${c.adminsEnabled} · ${c.adminLastLoginAt ? dateFr(c.adminLastLoginAt) : t('Jamais connecté')}` : '—'}</dd>
            </dl>
            {c.alerts.length > 0 && (
              <ul className="mt-3 space-y-1">{c.alerts.map((a) => <li key={a} className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-300">⚠ {t(ALERT[a] ?? a)}{a === 'late_requests' ? ` (${c.lateRequests})` : a === 'refunds_due' ? ` (${c.refundsDue})` : ''}</li>)}</ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
