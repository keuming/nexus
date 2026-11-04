import { hc } from 'hono/client';
import type { AppType } from '../../server/app';

export const api = hc<AppType>('/').api;

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

/** Déballe une réponse hono-client : renvoie le JSON ou lève une ApiError lisible. */
export async function unwrap<T>(p: Promise<{ ok: boolean; status: number; json(): Promise<T> }>): Promise<T> {
  const res = await p;
  const body: any = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error?.code ?? 'error', body?.error?.message ?? 'Une erreur est survenue');
  return body as T;
}
export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Erreur');
export const fcfa = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
export const dateFr = (d: string | Date) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
