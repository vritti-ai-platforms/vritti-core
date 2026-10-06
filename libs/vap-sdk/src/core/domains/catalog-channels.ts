import type { ApolloClient } from '@apollo/client';
import {
  CATALOG_LISTING_QUERY,
  CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  CATALOG_LISTINGS_QUERY,
  LE_CATALOG_LISTING_QUERY,
  LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  LE_CATALOG_LISTINGS_QUERY,
  SITE_CATALOG_LISTING_QUERY,
  SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
  SITE_CATALOG_LISTINGS_QUERY,
} from '../graphql/catalog-channels';
import { requireData, run } from '../transport/errors';
import type { Money } from '../types';
import { contextForScope, type RequestContext, type WorkspaceScope } from '../types';

/** Which junction a filter group came from. Presentation only — both kinds filter identically. */
export type FilterKind = 'DIMENSION' | 'ATTRIBUTE';

/** How a page of listings is ordered. `FEATURED` is core's own order. */
export type ListingSort = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';

/** One group in the filter rail — a dimension or an attribute, grouped by code across offerings. */
export type ListingFilter = {
  kind: FilterKind;
  code: string;
  name: string;
  sortOrder: number;
  values: { code: string; name: string; count: number }[];
};

/** A group the caller has selected. Codes, not ids, so a filtered URL survives a reseed. */
export type ListingFilterSelection = { code: string; values: string[] };

export type ListingQuery = {
  filters?: ListingFilterSelection[];
  page?: number;
  perPage?: number;
  sort?: ListingSort;
};

/** One page of listings, with the rail that produced it. */
export type CatalogListings = {
  items: CatalogListing[];
  total: number;
  page: number;
  perPage: number;
  filters: ListingFilter[];
};

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
     * One page of what is sellable, delisted rows and channel exclusions already dropped, with the
     * filter rail that produced it.
     *
     * Always paged — `perPage` defaults to 12 on core. `filters` on the result is the rail, and
     * core only computes it because this document selects it.
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
    async listings(
      query: ListingQuery = {},
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListings> {
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      const variables = {
        filters: query.filters,
        page: query.page,
        perPage: query.perPage,
        sort: query.sort,
      };
      // Each scope is its own query on core, checked against its own permission — and the header
      // sent is the one that scope names, so the two always agree.
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({ query: SITE_CATALOG_LISTINGS_QUERY, variables, context: requestContext });
          return requireData(r.data).siteCatalogListings as CatalogListings;
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_LISTINGS_QUERY, variables, context: requestContext });
          return requireData(r.data).leCatalogListings as CatalogListings;
        }
        const r = await client.query({ query: CATALOG_LISTINGS_QUERY, variables, context: requestContext });
        return requireData(r.data).catalogListings as CatalogListings;
      });
    },

    /**
     * One listing, by the variant a storefront stores against its own product record.
     *
     * The read a product page wants: it already knows which variant it is about, and needs that
     * variant's price and whether this shop sells it at all. `null` is the honest answer to the
     * second question — the row is absent from the resolved catalogue, delisted, or excluded from
     * this channel, and a page can say "not available" rather than guessing from a missing price.
     *
     * Prefer this over pulling the range to look one row up in it.
     */
    async listing(
      variantId: string,
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListing | null> {
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      const variables = { variantId };
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({ query: SITE_CATALOG_LISTING_QUERY, variables, context: requestContext });
          return (requireData(r.data).siteCatalogListing as CatalogListing | null) ?? null;
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_LISTING_QUERY, variables, context: requestContext });
          return (requireData(r.data).leCatalogListing as CatalogListing | null) ?? null;
        }
        const r = await client.query({ query: CATALOG_LISTING_QUERY, variables, context: requestContext });
        return (requireData(r.data).catalogListing as CatalogListing | null) ?? null;
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
          const r = await client.query({
            query: SITE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
            variables,
            context: requestContext,
          });
          return requireData(r.data).siteCatalogListingsFromVariants as CatalogListing[];
        }
        if (scope === 'le') {
          const r = await client.query({
            query: LE_CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
            variables,
            context: requestContext,
          });
          return requireData(r.data).leCatalogListingsFromVariants as CatalogListing[];
        }
        const r = await client.query({
          query: CATALOG_LISTINGS_FROM_VARIANTS_QUERY,
          variables,
          context: requestContext,
        });
        return requireData(r.data).catalogListingsFromVariants as CatalogListing[];
      });
    },
  };
}

export type CatalogChannelsOperations = ReturnType<typeof createCatalogChannelsOperations>;
