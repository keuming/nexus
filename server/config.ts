import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  NODE_ENV: z.string().default('development'),
  // E-mail d'alerte (Resend) : facultatif. Sans clé, seules les alertes dans l'application sont créées.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().max(200).optional(),
  // Photos des offres : Cloudinary (envoi direct depuis le navigateur, preset non signé). Sans ces variables : repli base64 en base.
  CLOUDINARY_CLOUD_NAME: z.string().regex(/^[a-z0-9_-]+$/i).optional(),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1).optional(),
  // Paiement ORZAYAH : facultatif (sans clé, seules les offres gratuites peuvent être réservées).
  ORZAYAH_API_KEY: z.string().optional(),
  ORZAYAH_API_URL: z.string().url().default('https://api.orzayah.com/api/public/v1'),
  // Secret de signature des webhooks ORZAYAH (whsec_…) et URL publique du site (adresse de retour https).
  ORZAYAH_WEBHOOK_SECRET: z.string().optional(),
  APP_URL: z.string().url().optional(),
  // Clé de chiffrement (base64, 32 octets) des clés ORZAYAH des marchands. Sans elle, dérivée de JWT_SECRET.
  SECRETS_KEY: z.string().optional(),
  HOLD_MINUTES: z.coerce.number().int().min(5).max(120).default(15),
});

export type Config = z.infer<typeof schema>;
let cached: Config | undefined;

export function config(): Config {
  if (!cached) {
    const r = schema.safeParse(process.env);
    if (!r.success) {
      throw new Error('Configuration invalide: ' + r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    }
    cached = r.data;
  }
  return cached;
}

/** Pour les tests : relit process.env au prochain appel de config(). */
export const resetConfig = () => { cached = undefined; };
