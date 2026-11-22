import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { PAYMENT_METHODS } from '../../shared/constants';
import { SITE } from '../../shared/site';
import { ShareButton, absUrl } from './ShareButton';
import { useMyCompany } from '../lib/company';
import { useT } from '../lib/i18n';

const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{children}</h3>;
const L = ({ to, children }: { to: string; children: React.ReactNode }) => <li><Link to={to} className="text-sm text-zinc-300 hover:text-white">{children}</Link></li>;

/** Pied de page : marque, navigation, aide, moyens de paiement, informations légales. */
export function Footer() {
  const { user } = useAuth();
  const t = useT();
  const mine = useMyCompany();
  const shop = user?.role === 'owner' ? mine.data : null; // un partenaire ne partage que sa boutique
  return (
    <footer className="mt-10 border-t border-white/10 bg-[#090b0f] relative z-10 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1.5fr]">
        <div className="space-y-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">Back<span className="text-brand">Market</span></Link>
          <p className="text-sm text-zinc-400">{t(SITE.tagline)} {t('Transport, hôtels, restaurants, loisirs, smartphones, laptops et tablettes auprès de prestataires validés.')}</p>
        </div>

        <nav aria-label="Navigation">
          <H>{t('Découvrir')}</H>
          <ul className="space-y-2">
            <L to={shop ? `/boutique/${shop.id}` : '/'}>{shop ? t('Ma boutique') : t('Catalogue')}</L>
            {user?.role === 'customer' && <L to="/account">{t('Mes réservations')}</L>}
            {!user && <L to="/login">{t('Connexion')}</L>}
            {!user && <L to="/register">{t('Créer un compte')}</L>}
          </ul>
        </nav>

        <nav aria-label="Partenaires et informations">
          <H>{t('Partenaires')}</H>
          <ul className="space-y-2">
            {user?.role === 'owner' ? <L to="/company">{t('Mon entreprise')}</L> : <L to="/souscription">{t('Devenir partenaire')}</L>}
            <L to="/conditions">{t('Conditions de réservation')}</L>
            <L to="/confidentialite">{t('Confidentialité')}</L>
            <L to="/mentions-legales">{t('Mentions légales')}</L>
          </ul>
        </nav>

        <div className="space-y-4">
          <div>
            <H>{t('Contact')}</H>
            <address className="space-y-1 text-sm not-italic text-zinc-300">
              <p>{SITE.company}</p>
              <p><a className="hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
              {SITE.phone && <p><a className="hover:text-white" href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></p>}
            </address>
          </div>
          <div>
            <H>{t('Paiement sécurisé')}</H>
            <ul className="flex flex-wrap gap-1.5 lg:flex-nowrap">
              {PAYMENT_METHODS.map((m) => <li key={m.id} className="whitespace-nowrap rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-300">{m.label}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {SITE.copyright}. {t('Tous droits réservés.')}</p>
          <p>{t('Paiements Mobile Money via ORZAYAH')}</p>
        </div>
      </div>
    </footer>
  );
}
