import { CLIENT_ID_HEADER, PARTY_ID_HEADER } from '../core/transport/headers.js';
import type { VapSdkConfig } from '../core/types.js';
import { signRequest, WORKSPACE_HEADER_ORDER } from './signing.js';

// The `fetch` Apollo's HttpLink calls, wrapped to sign what it is about to send.
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
    // The context goes into the signature as well as onto the wire, so stripping or re-pointing either one in transit
    // invalidates the request.
    for (const [name, value] of Object.entries(
      signRequest({ method: 'POST', path, body, partyId, workspaceHeaders }, config.clientSecret),
    )) {
      headers.set(name, value);
    }

    return doFetch(input, { ...init, headers, cache: 'no-store' });
  };
}
