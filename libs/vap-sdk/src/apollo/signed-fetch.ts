import { signRequest, WORKSPACE_HEADER_ORDER } from '../signing';
import type { VapSdkConfig } from '../types';

/** The client id core resolves the app — and therefore the tenant — from. */
export const CLIENT_ID_HEADER = 'x-vritti-client-id';

/** The party a request acts for, when the app names one. */
export const PARTY_ID_HEADER = 'x-party-id';

/**
 * The `fetch` Apollo's HttpLink calls, wrapped to sign what it is about to send.
 *
 * A custom fetch rather than a custom ApolloLink, deliberately. The signature covers the exact
 * request bytes, and only here do those bytes exist — a link sees an operation, but HttpLink is what
 * serialises it, and re-serialising to sign would risk a different key order and a signature over
 * bytes nobody sent.
 *
 * Context headers (`x-party-id`, one workspace header) are stamped onto the request by a setContext
 * link before this runs, so they are read back off the outgoing headers rather than captured in a
 * closure. That is what lets one long-lived client serve many parties and scopes: the signature is
 * built per request from the headers that request actually carries.
 */
export function createSignedFetch(config: VapSdkConfig): typeof fetch {
  const doFetch = config.fetch ?? globalThis.fetch;
  // Core signs over the pathname only; a query string would not match.
  const path = new URL(config.endpoint, 'http://placeholder').pathname;

  return async function signedFetch(input, init) {
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === 'string' ? init.body : '';

    const workspaceHeaders: Record<string, string> = {};
    for (const name of WORKSPACE_HEADER_ORDER) {
      const value = headers.get(name);
      if (value) workspaceHeaders[name] = value;
    }
    const partyId = headers.get(PARTY_ID_HEADER) ?? undefined;

    headers.set(CLIENT_ID_HEADER, config.clientId);
    // The context goes into the signature as well as onto the wire, so stripping or re-pointing
    // either one in transit invalidates the request.
    for (const [name, value] of Object.entries(
      signRequest({ method: 'POST', path, body, partyId, workspaceHeaders }, config.clientSecret),
    )) {
      headers.set(name, value);
    }

    return doFetch(input, { ...init, headers, cache: 'no-store' });
  };
}
