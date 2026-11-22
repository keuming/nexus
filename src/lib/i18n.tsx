import { countryName } from '../../shared/geo';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Lang = 'fr' | 'en';
const KEY = 'bm-lang';

/** Le français est la langue source : la clé est le texte français, la valeur sa traduction anglaise (texte absent = affiché en français). */
const EN: Record<string, string> = {
  // En-tête
  'Réservez en Afrique, simplement.': 'Book in Africa, simply.',
  'Transport, hôtels, restaurants, loisirs, high-tech, mode et beauté auprès d’entreprises validées par BackMarket.': 'Transport, hotels, restaurants, leisure, high-tech, fashion and beauty from businesses verified by BackMarket.',
  '♥ Favoris': '♥ Favorites', 'Mes réservations': 'My bookings', 'Devenir partenaire': 'Become a partner',
  'Accès compte': 'My account', 'Déconnexion': 'Log out', 'Créer un compte': 'Sign up', 'Connexion': 'Log in',
  'Ma boutique': 'My shop', 'Mon entreprise': 'My business', 'Catalogue': 'Catalog', 'Chargement…': 'Loading…',
  // Pied de page
  'Transport, hôtels, restaurants, loisirs, smartphones, laptops et tablettes auprès de prestataires validés.': 'Transport, hotels, restaurants, leisure, smartphones, laptops and tablets from verified providers.',
  'Découvrir': 'Discover', 'Partenaires': 'Partners', 'Conditions de réservation': 'Booking terms', 'Confidentialité': 'Privacy',
  'Mentions légales': 'Legal notice', 'Contact': 'Contact', 'Paiement sécurisé': 'Secure payment', 'Tous droits réservés.': 'All rights reserved.',
  'Paiements Mobile Money via ORZAYAH': 'Mobile Money payments via ORZAYAH',
  // Accueil
  'Services BackMarket': 'BackMarket services', 'Tous les services': 'All services',
  'Transport': 'Transport', 'Restauration': 'Restaurants', 'Expédition': 'Shipping', 'Hôtel': 'Hotels', 'Boutique': 'Shop',
  'Agence de voyage': 'Travel agency', 'Résidence meublée': 'Furnished rentals', 'Loisirs': 'Leisure', 'Location / vente': 'Rent / sale',
  'Smartphones': 'Smartphones', 'Laptops': 'Laptops', 'Tablettes': 'Tablets', 'Mode': 'Fashion', 'Beauté': 'Beauty',
  'Laptops / Tablettes': 'Laptops / Tablets', 'Mode / Beauté': 'Fashion / Beauty',
  'Pays': 'Country', 'Ville ou arrêt': 'City or stop', 'Rechercher': 'Search', 'Mot-clé…': 'Keyword…', 'Recherche': 'Search',
  'Pays de départ': 'Departure country', 'Ville de départ': 'Departure city', "Pays d'arrivée": 'Arrival country', "Ville d'arrivée": 'Arrival city',
  'Pays de destination': 'Destination country', 'Ville de destination': 'Destination city', "Pays d'enlèvement": 'Pickup country', "Ville d'enlèvement": 'Pickup city',
  'Pays de livraison': 'Delivery country', 'Ville de livraison': 'Delivery city', 'Destination (ville)': 'Destination (city)', 'Ville': 'City',
  'Passagers': 'Passengers', 'Voyageurs': 'Travelers', 'Prix max (FCFA)': 'Max price (FCFA)', 'Budget max / nuit (FCFA)': 'Max budget / night (FCFA)', 'Budget max (FCFA)': 'Max budget (FCFA)',
  'Cuisine': 'Cuisine', 'Type de colis': 'Parcel type', 'Type de billet': 'Ticket type', 'Type de chambre': 'Room type', 'Type de logement': 'Accommodation type',
  'Tous': 'All', 'Illimité': 'Unlimited', 'Toutes les villes': 'All cities', 'Tous les pays': 'All countries',
  'Autre pays : articles internationaux': 'Other country: international items',
  'Vous êtes une entreprise ?': 'Are you a business?', 'Devenez partenaire BackMarket': 'Become a BackMarket partner',
  'Chargement des offres…': 'Loading offers…', 'Impossible de charger les offres pour le moment.': 'Unable to load offers right now.', 'Réessayer': 'Try again',
  'Aucune offre ne correspond à votre recherche.': 'No offer matches your search.', 'Aucune offre disponible pour le moment.': 'No offers available right now.', 'Voir toutes les offres': 'See all offers',
  '★ À la une': '★ Featured', 'Pays :': 'Country:', 'Choisir un pays': 'Choose a country', 'Revenir à mon pays détecté': 'Back to my detected country',
  // Cartes et offres
  'Réserver': 'Book', 'Complet': 'Sold out', 'Gratuit': 'Free', 'Voir les détails ▼': 'Show details ▼', 'Masquer les détails ▲': 'Hide details ▲',
  'Arrêts :': 'Stops:', '🌍 International': '🌍 International', 'Partager cette offre': 'Share this offer', 'Pas encore d\'avis': 'No reviews yet',
  'Retirer des favoris': 'Remove from favorites', 'Ajouter aux favoris': 'Add to favorites', 'Publicité': 'Ad', 'Sponsorisé': 'Sponsored',
  'Continuer vers BackMarket ✕': 'Continue to BackMarket ✕', '← Retour au catalogue': '← Back to catalog', 'Avis des clients': 'Customer reviews',
  'Offre introuvable ou indisponible': 'Offer not found or unavailable', 'Voir le catalogue': 'View catalog',
  // Favoris / compte
  'Mes favoris': 'My favorites', 'Aucun favori pour le moment. Touchez le ♡ d\'une offre pour la retrouver ici.': 'No favorites yet. Tap the ♡ on an offer to find it here.',
  'Aucune réservation.': 'No bookings.', 'Annuler': 'Cancel', 'Suivre le paiement': 'Track payment', 'Payée': 'Paid', 'Livrée': 'Delivered', 'En préparation': 'Being prepared',
  'Remboursement en cours': 'Refund in progress', 'Annulée': 'Cancelled', 'Voir le reçu': 'View receipt', '★ Laisser un avis': '★ Leave a review',
  'Merci pour votre avis': 'Thanks for your review', 'Publier mon avis': 'Post my review', 'Votre avis (facultatif)': 'Your review (optional)',
  'Plus que {n} !': 'Only {n} left!', '{n} disponibles': '{n} available',
  'Annuler cette réservation ?': 'Cancel this booking?',
};

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (fr: string, vars?: Record<string, string | number>) => string }
const I18n = createContext<Ctx>({ lang: 'fr', setLang: () => undefined, t: (s) => s });

const initial = (): Lang => {
  try {
    const p = new URLSearchParams(window.location.search).get('lang');
    if (p === 'fr' || p === 'en') return p;
    const s = localStorage.getItem(KEY);
    if (s === 'fr' || s === 'en') return s;
  } catch { /* ignore */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
};

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem(KEY, l); } catch { /* ignore */ } };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const value = useMemo<Ctx>(() => ({
    lang, setLang,
    t: (fr, vars) => {
      let s = lang === 'en' ? (EN[fr] ?? fr) : fr;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
      return s;
    },
  }), [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);
export const useT = () => useContext(I18n).t;

/** Choix de la langue : drapeaux français et anglais. */
export function LangSwitch() {
  const { lang, setLang } = useI18n();
  const b = (l: Lang, flag: string, label: string) => (
    <button type="button" lang={l} aria-label={label} aria-pressed={lang === l} title={label} onClick={() => setLang(l)}
      className={`rounded-md px-1.5 py-1 text-lg leading-none transition ${lang === l ? 'bg-white/15 ring-1 ring-brand' : 'opacity-60 hover:opacity-100'}`}>{flag}</button>
  );
  return <div role="group" aria-label="Langue / Language" className="flex items-center gap-1">{b('fr', '🇫🇷', 'Français')}{b('en', '🇬🇧', 'English')}</div>;
}

/** Nom d'un pays dans la langue choisie (français : référentiel du site, anglais : noms standards du navigateur). */
export function useCountryName() {
  const { lang } = useI18n();
  return useMemo(() => {
    if (lang !== 'en' || typeof Intl.DisplayNames === 'undefined') return (code: string) => countryName(code);
    const dn = new Intl.DisplayNames(['en'], { type: 'region' });
    return (code: string) => { try { return dn.of(code) ?? countryName(code); } catch { return countryName(code); } };
  }, [lang]);
}
