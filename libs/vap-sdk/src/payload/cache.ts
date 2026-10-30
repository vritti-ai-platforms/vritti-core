import type { Endpoint } from 'payload' with { 'resolution-mode': 'import' };
import type { ResponseCacheStore } from '../core/transport/response-cache-store.js';
import { VapWebhookError, verifyVapSignedRequest } from '../server/webhooks.js';

export const VAP_CACHE_CLEAR_PATH = '/vap/cache/clear';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/**
 * Core tells the storefront its cached answers are out of date — a price edited, a listing added — so the next
 * request asks core instead of waiting out the TTL.
 *
 * Signed by core with the app's credential, like the product endpoints: a storefront visitor has no business making
 * this site hammer core. `{ operations: ['SiteCatalogListings', …] }` clears those operations; no `operations`
 * clears everything.
 *
 * Expires rather than deletes, so a clear sent moments before core goes down still leaves every response there to
 * fall back on.
 */
export function cacheClearEndpoint(options: { clientSecret: string; store: ResponseCacheStore }): Endpoint {
  return {
    path: VAP_CACHE_CLEAR_PATH,
    method: 'post',
    handler: async (req) => {
      let body: unknown;
      try {
        body = verifyVapSignedRequest({
          rawBody: await (req.text?.() ?? Promise.resolve('')),
          headers: req.headers,
          clientSecret: options.clientSecret,
        }).body;
      } catch (error) {
        const reason = error instanceof VapWebhookError ? error.reason : 'bad_signature';
        return json(401, { error: reason });
      }

      const operations = (body as { operations?: unknown } | null)?.operations;
      if (
        operations !== undefined &&
        (!Array.isArray(operations) || operations.some((op) => typeof op !== 'string' || op.trim() === ''))
      ) {
        return json(400, { error: 'Pass { operations?: string[] } — operation names, or nothing to clear all.' });
      }

      // Keys are `<operation>:<hash>`, so the colon keeps `SiteCatalogListings` from also clearing
      // `SiteCatalogListingsByCodes`.
      const prefixes = operations?.length ? (operations as string[]).map((op) => `${op.trim()}:`) : [''];
      let cleared = 0;
      for (const prefix of prefixes) cleared += await options.store.invalidate(prefix);

      return json(200, { cleared });
    },
  };
}
