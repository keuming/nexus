import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../server/app.js';
import * as schema from '../server/db/schema.js';
import type { Db } from '../server/db/client.js';

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.DATABASE_URL = 'postgres://unused';

/** Base PGlite créée à partir du db/schema.sql livré : le test valide le vrai script. */
export async function makeApp() {
  const pg = new PGlite();
  await pg.exec(readFileSync(join(import.meta.dirname, '../db/schema.sql'), 'utf8'));
  const db = drizzle(pg, { schema }) as unknown as Db;
  const app = createApp(() => db);
  return { app, db, pg };
}

export class Client {
  cookie = '';
  constructor(private app: ReturnType<typeof createApp>) {}
  async call(method: string, path: string, body?: unknown) {
    const res = await this.app.request(`http://localhost/api${path}`, {
      method,
      headers: { 'content-type': 'application/json', ...(this.cookie ? { cookie: this.cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) this.cookie = set.includes('Max-Age=0') ? '' : set.split(';')[0];
    const json = (await res.json().catch(() => null)) as any;
    return { status: res.status, json };
  }
  get = (p: string) => this.call('GET', p);
  post = (p: string, b?: unknown) => this.call('POST', p, b ?? {});
  patch = (p: string, b: unknown) => this.call('PATCH', p, b);
}
