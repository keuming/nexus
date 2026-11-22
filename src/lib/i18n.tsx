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
  // Connexion / inscription
  'Se connecter': 'Log in', 'Pas de compte ?': 'No account?', 'Email': 'Email', 'Mot de passe': 'Password', 'Nom': 'Name',
  'Mot de passe (8 caractères min.)': 'Password (min. 8 characters)', 'Créer mon compte': 'Create my account',
  'Cet email est déjà utilisé': 'This email is already in use', 'Cet email est déjà utilisé : connectez-vous avec ce compte': 'This email is already in use: log in with that account',
  'Authentification requise': 'Authentication required', 'Requête invalide': 'Invalid request', 'Une erreur est survenue': 'Something went wrong', 'Erreur': 'Error',
  'Email ou mot de passe incorrect': 'Incorrect email or password', 'Identifiants invalides': 'Invalid credentials', 'Accès refusé': 'Access denied',
  // Souscription partenaire
  'Devenez': 'Become a', 'partenaire': 'partner', 'BackMarket': 'BackMarket',
  'Souscription réservée aux entreprises. Votre demande est examinée par BackMarket avant la publication de vos offres.': 'Sign-up is reserved for businesses. Your request is reviewed by BackMarket before your offers are published.',
  'Votre entreprise': 'Your business', 'Le gérant': 'The manager', 'Accès à votre espace': 'Access to your space',
  'Nom et prénoms': 'Full name', 'Fonction': 'Job title', 'Gérant': 'Manager', 'Téléphone / WhatsApp du gérant': "Manager's phone / WhatsApp",
  'E-mail de connexion': 'Login email', 'Confirmer le mot de passe': 'Confirm password', '8 caractères minimum': '8 characters minimum',
  'J’atteste que les informations fournies sont exactes et que je suis habilité(e) à engager l’entreprise.': 'I certify that the information provided is accurate and that I am authorized to bind the company.',
  'Envoyer ma demande de souscription': 'Submit my partner application', 'Déjà partenaire ?': 'Already a partner?',
  'Vous souhaitez seulement réserver ?': 'Only want to book?', 'Compte client': 'Customer account',
  'Renseignez la géolocalisation de votre entreprise.': 'Please provide your business location.', 'Les deux mots de passe ne correspondent pas.': 'The two passwords do not match.',
  // Champs entreprise
  'Raison sociale / nom commercial': 'Company / trade name', 'Type de service': 'Service type', 'Pays du marchand *': "Merchant's country *",
  'Adresse (quartier, rue, repère)': 'Address (area, street, landmark)', 'Téléphone de l’entreprise': 'Business phone',
  'E-mail de l’entreprise (facultatif)': 'Business email (optional)', 'N° RCCM (facultatif)': 'Trade register no. (optional)',
  'Villes de service': 'Service cities', 'Ex. Bouaké': 'e.g. Bouaké',
  'Villes desservies par votre compagnie. Les arrêts se définissent pour chaque offre.': 'Cities served by your company. Stops are set for each offer.',
  'Villes où vous proposez vos services.': 'Cities where you offer your services.',
  'Géolocalisation de l’entreprise': 'Business location', 'Placez-vous sur le lieu de votre établissement puis utilisez votre position, ou saisissez les coordonnées.': 'Stand at your business premises and use your position, or enter the coordinates.',
  'Utiliser ma position actuelle': 'Use my current location', 'Localisation…': 'Locating…', 'Latitude': 'Latitude', 'Longitude': 'Longitude',
  'Vérifier l’emplacement sur la carte': 'Check the location on the map',
  'Coordonnées invalides (latitude −90 à 90, longitude −180 à 180).': 'Invalid coordinates (latitude −90 to 90, longitude −180 to 180).',
  "La géolocalisation n'est pas disponible sur cet appareil : saisissez les coordonnées.": 'Geolocation is not available on this device: enter the coordinates.',
  'Autorisation refusée : autorisez la localisation dans le navigateur ou saisissez les coordonnées.': 'Permission denied: allow location in your browser or enter the coordinates.',
  'Position introuvable, réessayez ou saisissez les coordonnées.': 'Position not found, try again or enter the coordinates.',
  'Portée de votre activité *': 'Scope of your business *', '(plusieurs choix possibles)': '(several choices possible)',
  'National': 'National', 'International': 'International',
  "Vous pouvez publier des articles visibles dans tous les pays.": 'You can publish items visible in all countries.',
  'Vos articles s\'affichent aux clients connectés depuis {country}.': 'Your items are shown to customers browsing from {country}.',
  'Position enregistrée (précision ≈ {m} m).': 'Position saved (accuracy ≈ {m} m).',
  'Ajouter': 'Add', 'Ajouter…': 'Add…', 'Retirer': 'Remove', 'Choisir une ville…': 'Choose a city…', 'Autre ville…': 'Other city…', 'Nom de la ville': 'City name', 'Autre ville': 'Other city',
  'Plus que {n} !': 'Only {n} left!', '{n} disponibles': '{n} available',
  'Fermer': 'Close', 'Fermer la publicité': 'Close the ad', 'Touchez ici pour découvrir gaRAN': 'Tap here to discover gaRAN',
  'Vous serez redirigé vers apps.garan.solutions': 'You will be redirected to apps.garan.solutions',
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
