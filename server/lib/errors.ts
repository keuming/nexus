import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  constructor(public status: ContentfulStatusCode, public code: string, message: string) {
    super(message);
  }
}
export const notFound = (what = 'Ressource') => new AppError(404, 'not_found', `${what} introuvable`);
export const forbidden = (msg = 'Accès refusé') => new AppError(403, 'forbidden', msg);
export const unauthorized = (msg = 'Authentification requise') => new AppError(401, 'unauthorized', msg);
export const conflict = (code: string, msg: string) => new AppError(409, code, msg);
