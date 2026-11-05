import type { Activity } from './constants';

/** Catégories proposées au partenaire (et en filtre de recherche) pour chaque type de service. */
export const CATEGORIES: Partial<Record<Activity, { label: string; options: string[] }>> = {
  restauration: { label: 'Cuisine', options: ['Africaine', 'Ivoirienne', 'Grillades & braisés', 'Fast-food', 'Pâtisserie & boulangerie', 'Libanaise', 'Internationale', 'Boissons & jus'] },
  expedition: { label: 'Type de colis', options: ['Document / courrier', 'Petit colis (< 5 kg)', 'Colis moyen (5–30 kg)', 'Gros colis / palette', 'Express (24 h)'] },
  agence_voyage: { label: 'Type de billet', options: ['Avion', 'Bus', 'Train', 'Bateau', 'Séjour / forfait'] },
  hotel: { label: 'Type de chambre', options: ['Standard', 'Supérieure', 'Suite', 'Familiale', 'Dortoir'] },
  residence_meuble: { label: 'Type de logement', options: ['Chambre', 'Studio', 'Appartement', 'Villa', 'Duplex'] },
};

/** Services dont l'offre est un trajet : départ → arrivée. */
export const ROUTE_ACTIVITIES = ['transport', 'expedition', 'agence_voyage'] as const;

/** Composition du formulaire de recherche de chaque service (le reste des services garde la recherche simple). */
export interface SearchForm {
  from?: { country: string; city: string };   // lieu principal (ou départ)
  to?: { country: string; city: string };     // arrivée / livraison
  date?: string;
  guests?: string;
  category?: boolean;
  budget?: string;
}
export const SEARCH_FORMS: Partial<Record<Activity, SearchForm>> = {
  transport: { from: { country: 'Pays de départ', city: 'Ville de départ' }, to: { country: "Pays d'arrivée", city: "Ville d'arrivée" }, date: 'Date du voyage', guests: 'Passagers', budget: 'Prix max (FCFA)' },
  agence_voyage: { from: { country: 'Pays de départ', city: 'Ville de départ' }, to: { country: 'Pays de destination', city: 'Ville de destination' }, date: 'Date de départ', guests: 'Voyageurs', category: true, budget: 'Prix max (FCFA)' },
  expedition: { from: { country: "Pays d'enlèvement", city: "Ville d'enlèvement" }, to: { country: 'Pays de livraison', city: 'Ville de livraison' }, date: "Date d'enlèvement", category: true, budget: 'Prix max (FCFA)' },
  hotel: { from: { country: 'Pays', city: 'Destination (ville)' }, guests: 'Voyageurs', category: true, budget: 'Budget max / nuit (FCFA)' },
  residence_meuble: { from: { country: 'Pays', city: 'Destination (ville)' }, guests: 'Voyageurs', category: true, budget: 'Budget max / nuit (FCFA)' },
  restauration: { from: { country: 'Pays', city: 'Ville' }, category: true, budget: 'Budget max (FCFA)' },
};
