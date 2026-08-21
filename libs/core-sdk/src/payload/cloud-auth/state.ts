import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const STATE_COOKIE = 'vritti-cloud-oauth';
const STATE_TTL_MS = 10 * 60 * 1000;

export interface LoginState {
  state: string;
  verifier: string;
  /** The exact redirect_uri sent to authorize — the token exchange must present the identical string */
  redirectUri: string;
  /** Where to land in the admin panel once the session exists */
  returnTo: string;
  expiresAt: number;
}

export function createPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
}

export function randomState(): string {
  return randomBytes(16).toString('base64url');
}

/**
 * The login leg's state, parked in a cookie rather than a table.
 *
 * Signed with Payload's own secret and read back once: nothing here is secret to the user it belongs to
 * (it is their own PKCE verifier), but it must not be *forgeable*, or a crafted cookie could pair an
 * attacker's code with a victim's browser.
 */
export function sealState(state: LoginState, secret: string): string {
  const payload = Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

export function openState(cookie: string | undefined, secret: string): LoginState | null {
  if (!cookie) return null;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as LoginState;
    return state.expiresAt > Date.now() ? state : null;
  } catch {
    return null;
  }
}

export function stateExpiry(): number {
  return Date.now() + STATE_TTL_MS;
}

/**
 * `SameSite=Lax` because the browser arrives back at the callback from cloud's own domain — `Strict`
 * would withhold the cookie on that navigation and every sign-in would fail state validation.
 */
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

function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}
