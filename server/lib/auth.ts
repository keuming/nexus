import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { SESSION_DAYS } from '../../shared/constants.js';

export type Role = 'admin' | 'owner' | 'customer';
export interface SessionUser { id: string; role: Role }

const key = () => new TextEncoder().encode(config().JWT_SECRET);

export const hashPassword = (pw: string) => bcrypt.hash(pw, 11);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function signSession(u: SessionUser): Promise<string> {
  return new SignJWT({ role: u.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(u.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function readSession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] });
    const role = payload.role;
    if (!payload.sub || (role !== 'admin' && role !== 'owner' && role !== 'customer')) return null;
    return { id: payload.sub, role };
  } catch {
    return null;
  }
}
