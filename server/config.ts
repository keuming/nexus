import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  NODE_ENV: z.string().default('development'),
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
