import { config } from '../config.js';
import { AppError } from './errors.js';

/** Image hébergée sur NOTRE compte Cloudinary (jamais une URL arbitraire) ; renvoie l'URL nettoyée. */
export function cloudinaryUrl(p: string): string {
  const cloud = config().CLOUDINARY_CLOUD_NAME;
  let u: URL | null = null;
  try { u = new URL(p); } catch { /* invalide */ }
  if (!cloud || !u || u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com' || !u.pathname.startsWith(`/${cloud}/image/upload/`) || p.length > 400 || u.username || u.password)
    throw new AppError(400, 'invalid', 'Image invalide (envoyez-la depuis le formulaire)');
  return u.origin + u.pathname;
}
