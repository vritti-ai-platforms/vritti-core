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

/** The callback cloud derives for a provisioned website — the two must stay identical. */
export const CALLBACK_URL_PATH = `/api${CALLBACK_PATH}`;

// The shape this plugin needs from Payload's request. Structural, like everything else here.
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

/**
 * Starts the flow: mint state + a PKCE verifier, park them in a signed cookie, send the browser to cloud.
 *
 * The redirect URI is derived from the request's own origin and then *stored*, so the token exchange
 * presents the identical string even if a later request arrives with different headers — cloud compares
 * them byte for byte.
 */
async function handleLogin(req: EndpointRequest, options: VrittiCloudAuthOptions): Promise<Response> {
  const origin = resolveOrigin(req);

  // A site with the plugin installed but no OAuth app selected for it has none of the VRITTI_OAUTH_* values,
  // and resolving them throws. Answering with a 500 would be the wrong shape for what is a configuration
  // gap, not a failure: the button is rendered whether or not the site is set up, so pressing it lands back
  // on the login screen with something an administrator can act on.
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

/**
 * Finishes the flow.
 *
 * Cloud answers one of two ways and both are handled here: a code, or a standard `access_denied` for
 * someone who is not (or is no longer) a member of the organization. Either way the reconcile sweep runs,
 * which is what deletes the mirrored account of a person who was removed — the browser never carries a
 * subject, so the verdict comes from the client-authenticated back channel instead.
 */
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

    // Sweep before minting: an admin removed while somebody else was signing in is gone by the time the
    // panel loads, and the sweep can never delete the account being created here — cloud just vouched for it.
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

/**
 * The site's own origin, from the request rather than from configuration.
 *
 * A provisioned website is reached on the host cloud gave it, and that is exactly the host cloud derives
 * its allowed callback from — so reading it back off the request keeps the two in step with nothing to
 * configure. Proxy headers come first because the container itself sees plain HTTP behind Caddy.
 */
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
