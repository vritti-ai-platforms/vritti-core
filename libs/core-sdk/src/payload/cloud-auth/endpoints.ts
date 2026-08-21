import { reconcileMirroredUsers, upsertMirroredUser } from './accounts';
import { buildConsentUrl, exchangeCode, fetchUserInfo } from './client';
import { resolveCloudAuthCredentials } from './config';
import { issueSessionCookie } from './session';
import {
  createPkce,
  expiredStateCookie,
  openState,
  randomState,
  STATE_COOKIE,
  sealState,
  stateCookie,
  stateExpiry,
} from './state';
import type { PayloadInstance, VrittiCloudAuthOptions } from './types';

export const LOGIN_PATH = '/vritti-cloud/login';
export const CALLBACK_PATH = '/vritti-cloud/callback';

export const CALLBACK_URL_PATH = `/api${CALLBACK_PATH}`;

interface EndpointRequest {
  payload: PayloadInstance;
  headers: Headers;
  url?: string;
}

export function buildEndpoints(options: VrittiCloudAuthOptions) {
  const collection = options.collection ?? 'users';
  const adminRoute = options.adminRoute ?? '/admin';

  return [
    {
      path: LOGIN_PATH,
      method: 'get' as const,
      handler: (req: EndpointRequest) => handleLogin(req, options),
    },
    {
      path: CALLBACK_PATH,
      method: 'get' as const,
      handler: (req: EndpointRequest) => handleCallback(req, options, collection, adminRoute),
    },
  ];
}

// Starts the flow: mint state + a PKCE verifier, park them in a signed cookie, send the browser to cloud.
async function handleLogin(req: EndpointRequest, options: VrittiCloudAuthOptions): Promise<Response> {
  const origin = resolveOrigin(req);

  // Answers a site with no OAuth app selected on the login screen, not with a 500.
  let credentials: ReturnType<typeof resolveCloudAuthCredentials>;
  try {
    credentials = resolveCloudAuthCredentials(options);
  } catch (error) {
    req.payload.logger?.error({ err: error }, 'Vritti Cloud login is not configured for this site');
    return redirect(`${origin}${options.adminRoute ?? '/admin'}/login?error=vritti-not-configured`);
  }

  const redirectUri = `${origin}${CALLBACK_URL_PATH}`;
  const { verifier, challenge } = createPkce();
  const state = randomState();

  const sealed = sealState(
    {
      state,
      verifier,
      redirectUri,
      returnTo: options.adminRoute ?? '/admin',
      expiresAt: stateExpiry(),
    },
    req.payload.secret,
  );

  return new Response(null, {
    status: 302,
    headers: {
      location: buildConsentUrl({ credentials, redirectUri, state, codeChallenge: challenge }),
      'set-cookie': stateCookie(sealed, origin.startsWith('https://')),
    },
  });
}

// Finishes the flow.
async function handleCallback(
  req: EndpointRequest,
  options: VrittiCloudAuthOptions,
  collection: string,
  adminRoute: string,
): Promise<Response> {
  const { payload } = req;
  const credentials = resolveCloudAuthCredentials(options);
  const origin = resolveOrigin(req);
  const secure = origin.startsWith('https://');
  const url = new URL(req.url ?? `${origin}${CALLBACK_URL_PATH}`, origin);

  const stored = openState(readCookie(req.headers, STATE_COOKIE), payload.secret);
  const fail = (reason: string) => redirect(`${origin}${adminRoute}/login?error=${reason}`, expiredStateCookie(secure));

  if (!stored || stored.state !== url.searchParams.get('state')) {
    payload.logger?.warn('Vritti Cloud sign-in rejected: the state did not match or had expired');
    return fail('vritti-state');
  }

  if (url.searchParams.get('error')) {
    await reconcileMirroredUsers({ payload, collection, credentials });
    return fail('vritti-access-denied');
  }

  const code = url.searchParams.get('code');
  if (!code) return fail('vritti-no-code');

  try {
    const tokens = await exchangeCode({
      credentials,
      code,
      redirectUri: stored.redirectUri,
      codeVerifier: stored.verifier,
    });
    const info = await fetchUserInfo(credentials, tokens.access_token);

    // Sweeps before minting, so a removed admin is gone by the time the panel loads.
    await reconcileMirroredUsers({ payload, collection, credentials });

    const user = await upsertMirroredUser({ payload, collection, info });
    const sessionCookie = await issueSessionCookie({ payload, req, collectionSlug: collection, user });

    return redirect(`${origin}${stored.returnTo || adminRoute}`, expiredStateCookie(secure), sessionCookie);
  } catch (error) {
    payload.logger?.error({ err: error }, 'Vritti Cloud sign-in failed');
    return fail('vritti-failed');
  }
}

function redirect(location: string, ...cookies: string[]): Response {
  const headers = new Headers({ location });
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return new Response(null, { status: 302, headers });
}

// The site's own origin, from the request rather than from configuration.
function resolveOrigin(req: EndpointRequest): string {
  const forwardedHost = req.headers.get('x-forwarded-host');
  const host = forwardedHost ?? req.headers.get('host') ?? '';
  const proto = req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  if (host) return `${proto}://${host}`;
  return req.payload.config.serverURL ?? '';
}

function readCookie(headers: Headers, name: string): string | undefined {
  const header = headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}
