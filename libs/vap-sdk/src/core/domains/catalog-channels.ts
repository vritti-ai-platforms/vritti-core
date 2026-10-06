import type { ApolloClient } from '@apollo/client';
import {
  CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  CATALOG_LISTINGS_QUERY,
  LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  LE_CATALOG_LISTINGS_QUERY,
  SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  SITE_CATALOG_LISTINGS_QUERY,
} from '../graphql/catalog-channels';
import { requireData, run } from '../transport/errors';
import { contextForScope, type RequestContext, type WorkspaceScope } from '../types';
import type { Money } from '../types';

/** One item a storefront sells. */
export type CatalogListing = {
  /** The catalogue listing — what a site keys its own product record on. */
  id: string;
  offeringVariantId: string;
  sku: string | null;
  name: string | null;
  price: Money | null;
};

/**
 * The range this storefront sells.
 *
 * Needs no party, unlike the basket and wishlist: this is the shop's own catalogue rather than
 * one person's rows, so it is reachable from the unbound SDK. What it does need is the credential,
 * which is how core resolves which catalogue to answer with.
 *
 * Read only. A storefront lists what staff put in front of it.
 */
/** How long a listing read is cached when the caller does not say — the price-edit latency it accepts. */
const DEFAULT_LISTINGS_CACHE_SECONDS = 60;

export function createCatalogChannelsOperations(client: ApolloClient, context: RequestContext = {}) {
  return {
    /**
     * Everything sellable, delisted rows and channel exclusions already dropped.
     *
     * So a CMS filing a page against one of these cannot key it to something the shop cannot sell.
     *
     * `scope` picks the workspace header the read carries, and so which APP channel and which price
     * row answer: `org` (the default) sends none, `le` the configured legal entity, `site` the
     * configured site. Each scope is its own query on core with its own permission, so the code
     * checked and the header sent always name the same level.
     *
     * `cacheSeconds` keeps the result in the configured response cache for that long — 60 by default,
     * `0` to always ask core. Listings are the shop's own range, the same for every party, so they
     * are safe to share; the cache key carries the tenant, party and workspace, so one site's range
     * never answers for another. A price edited by staff shows within this many seconds. Without a
     * `responseCache` store on the SDK this has no effect.
     */
    async listings(options: { scope?: WorkspaceScope; cacheSeconds?: number } = {}): Promise<CatalogListing[]> {
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      // Each scope is its own query on core, checked against its own permission — and the header
      // sent is the one that scope names, so the two always agree.
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({ query: SITE_CATALOG_LISTINGS_QUERY, context: requestContext });
          return requireData(r.data).siteCatalogListings as CatalogListing[];
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_LISTINGS_QUERY, context: requestContext });
          return requireData(r.data).leCatalogListings as CatalogListing[];
        }
        const r = await client.query({ query: CATALOG_LISTINGS_QUERY, context: requestContext });
        return requireData(r.data).catalogListings as CatalogListing[];
      });
    },

    /**
     * The same range, narrowed to variants the caller already holds.
     *
     * For reconciling rows a site stores itself — a wishlist, a saved basket — without pulling the
     * whole catalogue to price a handful of items. Anything the storefront may not sell is simply
     * absent from the result rather than erroring, so a stale local row resolves to "no longer sold".
     */
    async listingsFromVariants(
      variantIds: string[],
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListing[]> {
      if (variantIds.length === 0) return [];
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      const variables = { variantIds };
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({ query: SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY, variables, context: requestContext });
          return requireData(r.data).siteCatalogListingsFromVariants as CatalogListing[];
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY, variables, context: requestContext });
          return requireData(r.data).leCatalogListingsFromVariants as CatalogListing[];
        }
        const r = await client.query({ query: CATALOG_LISTINGS_FROM_VARIANTS_QUERY, variables, context: requestContext });
        return requireData(r.data).catalogListingsFromVariants as CatalogListing[];
      });
    },
  };
}

export type CatalogChannelsOperations = ReturnType<typeof createCatalogChannelsOperations>;
