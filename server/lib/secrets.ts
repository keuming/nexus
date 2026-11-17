import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';

/** Clé AES-256 : SECRETS_KEY (base64, 32 octets) si fournie, sinon dérivée de JWT_SECRET. */
function key(): Buffer {
  const c = config();
  if (c.SECRETS_KEY) {
    const k = Buffer.from(c.SECRETS_KEY, 'base64');
    if (k.length === 32) return k;
  }
  return createHash('sha256').update(`bm-secrets:${c.JWT_SECRET}`).digest();
}

/** Chiffre un secret (AES-256-GCM) : `v1.<iv>.<tag>.<données>` en base64url. */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64url'), c.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptSecret(token: string): string {
  const [v, iv, tag, data] = token.split('.');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('secret illisible');
  const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  d.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64url')), d.final()]).toString('utf8');
}

/** Jamais de clé ORZAYAH (même chiffrée) dans une réponse : on n'expose que l'état « relié ». */
export function safeCompany<T extends { orzApiKeyEnc?: string | null; orzWebhookSecretEnc?: string | null }>(co: T) {
  const { orzApiKeyEnc, orzWebhookSecretEnc, ...rest } = co;
  return { ...rest, orzConnected: !!orzApiKeyEnc };
}
