import { config } from '../config.js';

/** Opération ORZAYAH normalisée (champs utiles de la réponse de l'API publique v1). */
export interface OrzOp {
  id: string;
  status: string; // INITIATED | PENDING | PROCESSING | SUCCESS | FAILED | CANCELLED | EXPIRED | REFUNDED
  feeAmount: string | null;
  failureReason: string | null;
  nextAction: { type?: string; message?: string; url?: string } | null;
}

export interface DepositInput { operator: 'ORANGE' | 'MTN' | 'MOOV' | 'WAVE'; accountNumber: string; amountCentimes: number; idempotencyKey: string }

export interface OrzayahClient {
  createDeposit(i: DepositInput): Promise<OrzOp>;
  /** `ref` : id ORZAYAH, référence publique ou idempotencyKey. `null` si l'opération est inconnue (404). */
  getTransaction(ref: string): Promise<OrzOp | null>;
}

/** `definitive` : la requête a été refusée, l'opération n'existe pas (400/401/403) ; sinon l'issue est incertaine. */
export class OrzayahError extends Error {
  constructor(public status: number, message: string, public definitive: boolean) { super(message); }
}

const normalize = (d: any): OrzOp => ({
  id: String(d?.id ?? ''),
  status: String(d?.status ?? 'PENDING'),
  feeAmount: d?.feeAmount == null ? null : String(d.feeAmount),
  failureReason: d?.failureReason ?? null,
  nextAction: d?.nextAction ?? null,
});

export class HttpOrzayah implements OrzayahClient {
  constructor(private key: string, private base: string) {}

  private async call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<any> {
    let res: Response;
    try {
      res = await fetch(this.base + path, {
        method,
        headers: { 'X-Api-Key': this.key, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new OrzayahError(0, 'ORZAYAH injoignable', false);
    }
    const json: any = await res.json().catch(() => null);
    if (!res.ok) {
      const raw = json?.error?.message;
      const message = String(Array.isArray(raw) ? raw.join(', ') : raw ?? `Erreur ${res.status}`).slice(0, 200);
      throw new OrzayahError(res.status, message, [400, 401, 403].includes(res.status));
    }
    return json?.data;
  }

  async createDeposit(i: DepositInput) {
    return normalize(await this.call('POST', '/deposits', { operator: i.operator, accountNumber: i.accountNumber, amount: i.amountCentimes, idempotencyKey: i.idempotencyKey }));
  }

  async getTransaction(ref: string) {
    try { return normalize(await this.call('GET', `/transactions/${encodeURIComponent(ref)}`)); }
    catch (e) { if (e instanceof OrzayahError && e.status === 404) return null; throw e; }
  }
}

let cached: OrzayahClient | null | undefined;
/** Client par défaut selon l'environnement ; `null` si la clé n'est pas configurée. */
export function defaultOrzayah(): OrzayahClient | null {
  if (cached === undefined) {
    const c = config();
    cached = c.ORZAYAH_API_KEY ? new HttpOrzayah(c.ORZAYAH_API_KEY, c.ORZAYAH_API_URL) : null;
  }
  return cached;
}
