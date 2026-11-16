import { config } from '../config.js';

/** Opération ORZAYAH normalisée (champs utiles de la réponse de l'API publique v1). */
export interface OrzOp {
  id: string;
  status: string; // INITIATED | PENDING | PROCESSING | SUCCESS | FAILED | CANCELLED | EXPIRED | REFUNDED
  feeAmount: string | null;
  failureReason: string | null;
  nextAction: { type?: string; message?: string; url?: string } | null;
  /** Montant du lien en centimes (à comparer au montant attendu avant de livrer). */
  amount: number | null;
  /** Page de paiement hébergée par ORZAYAH. */
  url: string | null;
}

export interface PaymentLinkInput {
  amountCentimes: number; description: string; idempotencyKey: string; externalReference: string; returnUrl: string;
}

export interface OrzayahClient {
  /** Crée un lien de paiement (même clé + même description = même lien). `id` = slug du lien. */
  createPaymentLink(i: PaymentLinkInput): Promise<OrzOp>;
  /** Source de vérité : relit le lien par son slug. `null` si inconnu (404). */
  getPaymentLink(slug: string): Promise<OrzOp | null>;
}

/** `definitive` : la requête a été refusée, l'opération n'existe pas (400/401/403) ; sinon l'issue est incertaine. */
export class OrzayahError extends Error {
  constructor(public status: number, message: string, public definitive: boolean) { super(message); }
}

const normalize = (d: any): OrzOp => {
  const amount = d?.amount == null ? null : Number(d.amount);
  return {
    id: String(d?.slug ?? ''),
    status: String(d?.status ?? 'PENDING'),
    feeAmount: null,
    failureReason: d?.transaction?.failureReason ?? null,
    nextAction: null,
    amount: Number.isFinite(amount) ? amount : null,
    url: typeof d?.url === 'string' ? d.url : null,
  };
};

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

  async createPaymentLink(i: PaymentLinkInput) {
    return normalize(await this.call('POST', '/payment-links', {
      amount: i.amountCentimes, description: i.description, idempotencyKey: i.idempotencyKey,
      externalReference: i.externalReference, returnUrl: i.returnUrl,
    }));
  }

  async getPaymentLink(slug: string) {
    try { return normalize(await this.call('GET', `/payment-links/${encodeURIComponent(slug)}`)); }
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
