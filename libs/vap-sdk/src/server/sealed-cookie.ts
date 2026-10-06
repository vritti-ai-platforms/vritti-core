import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * State parked in a signed cookie rather than a table.
 *
 * Several flows need a fact or two to survive a handful of requests — an OAuth leg's `state` and
 * PKCE verifier, an OTP sign-in's number and whether it was verified. Two properties make a cookie
 * the right home: the fact lives minutes, and it belongs to one browser. A table would want a
 * migration and a sweeper for the flows nobody finishes.
 *
 * **The signature is the point.** At least one of those facts is usually the authentication itself —
 * "this number was verified" — so a visitor must not be able to write it. A hidden form field would
 * let someone verify their own number and then post somebody else's.
 *
 * Shared because it was written twice: once here for cloud's OAuth leg, once again in a storefront
 * for its OTP flow, which copied the algorithm by hand down to the `timingSafeEqual` length guard.
 * A security primitive reimplemented per app is one that drifts per app.
 *
 * It is **not** encryption. The body is base64url, readable by anyone holding the cookie — so park
 * flow state here, never a secret. Pair it with `httpOnly` and, where the flow never leaves your
 * origin, `SameSite=Strict`.
 */
export interface SealedState {
  /** Epoch milliseconds. `open` refuses anything past it, so every sealed state carries its own TTL. */
  expiresAt: number;
}

/** The state and its signature, as one cookie value. */
export function seal<T extends SealedState>(state: T, secret: string): string {
  const body = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

/**
 * The state, or null if the cookie is absent, tampered with, or past its expiry.
 *
 * One return for every failure on purpose: a caller that cannot tell "forged" from "expired" cannot
 * accidentally treat one of them as recoverable.
 */
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

/** `expiresAt` for a state that should live `ttlMs` from now. */
export function sealedExpiry(ttlMs: number): number {
  return Date.now() + ttlMs;
}

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
