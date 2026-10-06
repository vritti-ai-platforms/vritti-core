import { createHash, randomBytes } from 'node:crypto';
import { open, seal, type SealedState, sealedExpiry } from '../../server/sealed-cookie';

export const STATE_COOKIE = 'vritti-cloud-oauth';
const STATE_TTL_MS = 10 * 60 * 1000;

export interface LoginState extends SealedState {
  state: string;
  verifier: string;
  redirectUri: string;
  /** Server-configured (the admin route), never caller-supplied — so it needs no open-redirect guard. */
  returnTo: string;
}

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
}

export function randomState(): string {
  return randomBytes(16).toString('base64url');
}

// The login leg's state, parked in a cookie rather than a table. See `seal` for why.
export function sealState(state: LoginState, secret: string): string {
  return seal(state, secret);
}

export function openState(cookie: string | undefined, secret: string): LoginState | null {
  return open<LoginState>(cookie, secret);
}

export function stateExpiry(): number {
  return sealedExpiry(STATE_TTL_MS);
}

// Uses SameSite=Lax because the browser returns to the callback from cloud's domain; Strict withholds it.
export function stateCookie(value: string, secure: boolean): string {
  const attributes = [
    `${STATE_COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(STATE_TTL_MS / 1000)}`,
  ];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}

export function expiredStateCookie(secure: boolean): string {
  const attributes = [`${STATE_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) attributes.push('Secure');
  return attributes.join('; ');
}
