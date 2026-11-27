export const ACTIVITIES = [
  'transport','restauration','expedition','hotel','boutique',
  'agence_voyage','residence_meuble','loisirs','location_vente',
  'smartphones','laptops','tablets','mode','beaute',
] as const;
export type Activity = (typeof ACTIVITIES)[number];
export const CREDIT_PRICE_FCFA = 125;
/** Délai laissé à une boutique sans crédit pour en acheter avant que la commande soit attribuée à une autre boutique. */
export const LOCK_MINUTES = 60;
export const COOKIE_NAME = 'backmarket_session';
export const SESSION_DAYS = 7;

/** Moyens d'encaissement disponibles via l'API publique ORZAYAH (dépôt Mobile Money). À étendre si ORZAYAH en ajoute. */
export const PAYMENT_METHODS = [
  { id: 'ORANGE', label: 'Orange Money' },
  { id: 'MTN', label: 'MTN MoMo' },
  { id: 'MOOV', label: 'Moov Money' },
  { id: 'WAVE', label: 'Wave' },
] as const;
export const PAYMENT_OPERATORS = PAYMENT_METHODS.map((m) => m.id) as unknown as ['ORANGE', 'MTN', 'MOOV', 'WAVE'];

/** Activités dont l'offre est liée à une date (trajet, voyage, sortie) : masquée une fois la date passée. */
