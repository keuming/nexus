import { drizzle } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import pg from 'pg';
import * as schema from './schema.js';
import { config } from '../config.js';

/** Type commun à node-postgres (prod) et PGlite (tests). */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
let db: Db | undefined;

/** Pool unique par instance serverless ; max 1 pour ne pas saturer Neon (utiliser l'URL « pooled »). */
export function getDb(): Db {
  if (!db) {
    const pool = new pg.Pool({
      connectionString: config().DATABASE_URL.replace(/[?&]channel_binding=[^&]*/g, ''),
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 10_000,
      ssl: /localhost|127\.0\.0\.1/.test(config().DATABASE_URL) ? undefined : { rejectUnauthorized: true },
    });
    db = drizzle(pool, { schema });
  }
  return db;
}
export { schema };
