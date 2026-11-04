import { zValidator } from '@hono/zod-validator';
import type { ZodSchema } from 'zod';
import type { ValidationTargets } from 'hono';
import { AppError } from './errors.js';

/** zValidator avec erreurs uniformes `{error:{code,message}}` (et un type de réponse client propre). */
export const v = <T extends ZodSchema, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (r) => {
    if (!r.success) {
      const i = r.error.issues[0];
      throw new AppError(400, 'invalid', i ? `${i.path.join('.') || 'requête'}: ${i.message}` : 'Requête invalide');
    }
  });
