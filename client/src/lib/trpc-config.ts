/**
 * Configuration d'optimisation tRPC
 * Réduit les requêtes initiales et implémente le caching
 */

/**
 * Configuration de cache pour les requêtes qui changent rarement
 */
export const QUERY_CACHE_CONFIG = {
  // Données statiques (1 heure)
  STATIC: {
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60 * 24, // 24 heures
  },
  
  // Données semi-statiques (5 minutes)
  SEMI_STATIC: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },
  
  // Données dynamiques (30 secondes)
  DYNAMIC: {
    staleTime: 1000 * 30, // 30 secondes
    gcTime: 1000 * 60 * 5, // 5 minutes
  },
  
  // Données temps réel (pas de cache)
  REALTIME: {
    staleTime: 0,
    gcTime: 0,
  },
};

/**
 * Configuration pour les requêtes initiales du dashboard
 * Charge seulement les données essentielles
 */
export const DASHBOARD_INITIAL_QUERIES = {
  // Stats du dashboard - semi-statiques
  stats: QUERY_CACHE_CONFIG.SEMI_STATIC,
  
  // Infos de la compagnie - statiques
  company: QUERY_CACHE_CONFIG.STATIC,
  
  // Crédits - dynamiques
  credits: QUERY_CACHE_CONFIG.DYNAMIC,
  
  // Messages - temps réel
  messages: QUERY_CACHE_CONFIG.DYNAMIC,
};

/**
 * Configuration pour les requêtes des onglets
 * Chargées à la demande (lazy loading)
 */
export const DASHBOARD_TAB_QUERIES = {
  // Départs - semi-statiques
  departures: QUERY_CACHE_CONFIG.SEMI_STATIC,
  
  // Billets - dynamiques
  tickets: QUERY_CACHE_CONFIG.DYNAMIC,
  
  // Réservations - dynamiques
  bookings: QUERY_CACHE_CONFIG.DYNAMIC,
  
  // Expéditions - dynamiques
  shipments: QUERY_CACHE_CONFIG.DYNAMIC,
  
  // Flotte - semi-statiques
  fleet: QUERY_CACHE_CONFIG.SEMI_STATIC,
  
  // Équipe - statiques
  team: QUERY_CACHE_CONFIG.STATIC,
  
  // Galerie - statiques
  gallery: QUERY_CACHE_CONFIG.STATIC,
};
