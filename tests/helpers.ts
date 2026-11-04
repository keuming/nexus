import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createApp } from '../server/app.js';
import { OrzayahError, type DepositInput, type OrzayahClient, type OrzOp } from '../server/lib/orzayah.js';
import * as schema from '../server/db/schema.js';
import type { Db } from '../server/db/client.js';

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.DATABASE_URL = 'postgres://unused';

/** Base PGlite créée à partir du db/schema.sql livré : le test valide le vrai script. */
/** Faux ORZAYAH : états pilotés par le test, mêmes règles d'idempotence que l'API réelle. */
export class FakeOrz implements OrzayahClient {
  ops = new Map<string, OrzOp>();
  deposits: DepositInput[] = [];
  failNext: OrzayahError | null = null;   // erreur au prochain createDeposit
  lostNext = false;                        // createDeposit « perdu » : l'API n'enregistre rien et renvoie une erreur réseau
  async createDeposit(i: DepositInput) {
    this.deposits.push(i);
    if (this.failNext) { const e = this.failNext; this.failNext = null; throw e; }
    if (this.lostNext) { this.lostNext = false; throw new OrzayahError(0, 'ORZAYAH injoignable', false); }
    const prev = this.ops.get(i.idempotencyKey);
    if (prev) return prev;
    const op: OrzOp = { id: `ref-${this.ops.size + 1}`, status: 'PENDING', feeAmount: '0', failureReason: null, nextAction: { type: 'CONFIRM_ON_PHONE', message: 'Validez sur votre téléphone' } };
    this.ops.set(i.idempotencyKey, op);
    return op;
  }
  async getTransaction(ref: string) { return this.ops.get(ref) ?? null; }
  set(key: string, status: string, failureReason: string | null = null) { const o = this.ops.get(key)!; this.ops.set(key, { ...o, status, failureReason }); }
}

export async function makeApp(orzayah: OrzayahClient | null = null) {
  const pg = new PGlite();
  await pg.exec(readFileSync(join(import.meta.dirname, '../db/schema.sql'), 'utf8'));
  const db = drizzle(pg, { schema }) as unknown as Db;
  const app = createApp(() => db, { orzayah });
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
