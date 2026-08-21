import { CoreError } from '../../types';
import type { CloudAuthCredentials } from './config';

export interface CloudUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  picture?: string | null;
  organization?: { id: string; name: string; subdomain: string };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface MemberStatus {
  sub: string;
  active: boolean;
}

/** Builds the URL a member is sent to in order to approve this app. */
export function buildConsentUrl(args: {
  credentials: CloudAuthCredentials;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}): string {
  const url = new URL('/oauth/authorize', args.credentials.consentUrl);
  url.searchParams.set('client_id', args.credentials.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge', args.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', args.state);
  if (args.scope) url.searchParams.set('scope', args.scope);
  return url.toString();
}

/** Exchanges the authorization code. Runs server to server, so the client secret never reaches a browser. */
export async function exchangeCode(args: {
  credentials: CloudAuthCredentials;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse> {
  return post<TokenResponse>(args.credentials, '/auth/oauth2/token', {
    grant_type: 'authorization_code',
    client_id: args.credentials.clientId,
    client_secret: args.credentials.clientSecret,
    code: args.code,
    redirect_uri: args.redirectUri,
    code_verifier: args.codeVerifier,
  });
}

export async function fetchUserInfo(credentials: CloudAuthCredentials, accessToken: string): Promise<CloudUserInfo> {
  const response = await fetch(`${credentials.apiUrl}/auth/oauth2/userinfo`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw await toError(response, 'userinfo');
  return (await response.json()) as CloudUserInfo;
}

/**
 * Which of these people are still members of the app's organization.
 *
 * The reconcile channel: it is how an admin record for someone who was removed — and who therefore can
 * never complete a sign-in again — still gets deleted.
 */
export async function fetchMemberStatus(credentials: CloudAuthCredentials, subs: string[]): Promise<MemberStatus[]> {
  if (subs.length === 0) return [];
  return post<MemberStatus[]>(credentials, '/auth/oauth2/members/status', {
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    subs,
  });
}

async function post<T>(credentials: CloudAuthCredentials, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${credentials.apiUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await toError(response, path);
  return (await response.json()) as T;
}

async function toError(response: Response, what: string): Promise<CoreError> {
  const detail = await response.text().catch(() => '');
  const suffix = detail ? ` — ${detail.slice(0, 200)}` : '';
  return new CoreError(`Vritti Cloud rejected the ${what} request${suffix}`, 'OAuth Failed', response.status);
}
