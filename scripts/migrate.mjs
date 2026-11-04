// Applique db/schema.sql sur DATABASE_URL (idempotent). Usage : DATABASE_URL=... npm run migrate
import pg from 'pg';
import { readFileSync } from 'node:fs';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL manquant'); process.exit(1); }
const client = new pg.Client({ connectionString: url.replace(/[?&]channel_binding=[^&]*/g, ''), ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : true });
await client.connect();
try {
  await client.query(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  const { rows } = await client.query("select count(*)::int n from information_schema.tables where table_schema='public'");
  console.log(`Schéma appliqué. Tables publiques : ${rows[0].n}`);
} finally { await client.end(); }
