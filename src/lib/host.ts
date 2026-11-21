/** Le back-office d'administration vit sur son propre sous-domaine (backoffice.backmarket-ci.com). */
export const BACKOFFICE_HOST = 'backoffice.backmarket-ci.com';
export const isBackoffice = typeof window !== 'undefined' && window.location.hostname.startsWith('backoffice.');
