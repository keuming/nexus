export const ACTIVITIES = [
  'transport','restauration','expedition','hotel','boutique',
  'agence_voyage','residence_meuble','loisirs','location_vente',
] as const;
export type Activity = (typeof ACTIVITIES)[number];
export const CREDIT_PRICE_FCFA = 125;
export const COOKIE_NAME = 'nexus_session';
export const SESSION_DAYS = 7;
