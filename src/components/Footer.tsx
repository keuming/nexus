import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { PAYMENT_METHODS } from '../../shared/constants';
import { SITE } from '../../shared/site';

const H = ({ children }: { children: React.ReactNode }) => <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{children}</h3>;
const L = ({ to, children }: { to: string; children: React.ReactNode }) => <li><Link to={to} className="text-sm text-zinc-300 hover:text-white">{children}</Link></li>;

/** Pied de page : marque, navigation, aide, moyens de paiement, informations légales. */
export function Footer() {
  const { user } = useAuth();
  return (
    <footer className="mt-10 border-t border-white/10 bg-black/20 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1.5fr]">
        <div className="space-y-3">
          <Link to="/" className="text-xl font-extrabold tracking-tight">Back<span className="text-brand">Market</span></Link>
          <p className="text-sm text-zinc-400">{SITE.tagline} Transport, hôtels, restaurants, loisirs, smartphones, laptops et tablettes auprès de prestataires validés.</p>
        </div>

        <nav aria-label="Navigation">
          <H>Découvrir</H>
          <ul className="space-y-2">
            <L to="/">Catalogue</L>
            {user?.role === 'customer' && <L to="/account">Mes réservations</L>}
            {!user && <L to="/login">Connexion</L>}
            {!user && <L to="/register">Créer un compte</L>}
          </ul>
        </nav>

        <nav aria-label="Partenaires et informations">
          <H>Partenaires</H>
          <ul className="space-y-2">
            {user?.role === 'owner' ? <L to="/company">Mon entreprise</L> : <L to="/souscription">Devenir partenaire</L>}
            <L to="/conditions">Conditions de réservation</L>
            <L to="/confidentialite">Confidentialité</L>
            <L to="/mentions-legales">Mentions légales</L>
          </ul>
        </nav>

        <div className="space-y-4">
          <div>
            <H>Contact</H>
            <address className="space-y-1 text-sm not-italic text-zinc-300">
              <p>{SITE.company}</p>
              <p><a className="hover:text-white" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
              {SITE.phone && <p><a className="hover:text-white" href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></p>}
            </address>
          </div>
          <div>
            <H>Paiement sécurisé</H>
            <ul className="flex flex-wrap gap-1.5 lg:flex-nowrap">
              {PAYMENT_METHODS.map((m) => <li key={m.id} className="whitespace-nowrap rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-300">{m.label}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} {SITE.copyright}. Tous droits réservés.</p>
          <p>Paiements Mobile Money via ORZAYAH</p>
        </div>
      </div>
    </footer>
  );
}
