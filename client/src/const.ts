export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Sur Vercel, on utilise l'auth locale (email/password) via /login
// Le système OAuth Manus n'est pas disponible hors de la plateforme Manus
export const getLoginUrl = () => {
  return "/login";
};
