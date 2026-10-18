import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SealedState {
  expiresAt: number;
}

// The state and its signature, as one cookie value.
export function seal<T extends SealedState>(state: T, secret: string): string {
  const body = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

// The state, or null if the cookie is absent, tampered with, or past its expiry.
export function open<T extends SealedState>(cookie: string | undefined, secret: string): T | null {
  if (!cookie) return null;

  const [body, signature] = cookie.split('.');
  if (!body || !signature) return null;

  const presented = Buffer.from(signature);
  const expected = Buffer.from(sign(body, secret));
  // Length first: timingSafeEqual throws on a mismatch rather than returning false.
  if (presented.length !== expected.length || !timingSafeEqual(presented, expected)) return null;

  try {
    const state = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    return state.expiresAt > Date.now() ? state : null;
  } catch {
    return null;
  }
}

// `expiresAt` for a state that should live `ttlMs` from now.
export function sealedExpiry(ttlMs: number): number {
  return Date.now() + ttlMs;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
