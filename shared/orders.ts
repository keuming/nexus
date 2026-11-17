/** Étapes de suivi d'une commande par le fournisseur (indépendantes du paiement et du stock). */
export const FULFILLMENT = ['new', 'accepted', 'preparing', 'ready', 'completed', 'no_show'] as const;
export type Fulfillment = (typeof FULFILLMENT)[number];

export const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  new: 'Nouvelle', accepted: 'Acceptée', preparing: 'En préparation', ready: 'Prête', completed: 'Terminée', no_show: 'Client absent',
};

/** Motifs proposés pour une annulation par le fournisseur. */
export const CANCEL_REASONS = ['Rupture de stock / indisponible', 'Créneau ou date impossible', 'Zone non desservie', 'Client injoignable', 'Erreur sur la commande', 'Autre'] as const;
