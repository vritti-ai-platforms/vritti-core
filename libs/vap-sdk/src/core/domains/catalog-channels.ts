import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors.js';
import {
  CATALOG_CURRENCIES_QUERY,
  CATALOG_LISTING_QUERY_BY_CODE,
  CATALOG_LISTINGS_BY_CODES_QUERY,
  CATALOG_LISTINGS_QUERY,
  LE_CATALOG_CURRENCIES_QUERY,
  LE_CATALOG_LISTING_QUERY_BY_CODE,
  LE_CATALOG_LISTINGS_BY_CODES_QUERY,
  LE_CATALOG_LISTINGS_QUERY,
  SITE_CATALOG_CURRENCIES_QUERY,
  SITE_CATALOG_LISTING_QUERY_BY_CODE,
  SITE_CATALOG_LISTINGS_BY_CODES_QUERY,
  SITE_CATALOG_LISTINGS_QUERY,
} from '../graphql/catalog-channels.js';
import { requireData, run } from '../transport/errors.js';
import type { Money } from '../types.js';
import { contextForScope, type RequestContext, type WorkspaceScope } from '../types.js';

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

/** One option on an axis — a flavour, a pack size. */
export type VariantOption = {
  code: string;
  name: string;
  selected: boolean;
  /**
   * The sibling this option leads to, holding every other axis where it is. `null` when that
   * combination is not sold here — render it disabled rather than hiding it, or the range looks
   * smaller than it is.
   */
  variantCode: string | null;
};

/** One axis of an offering — Pack Size, Flavours — as a product page switches on it. */
export type VariantAxis = {
  code: string;
  name: string;
  sortOrder: number;
  options: VariantOption[];
};

/** One listing with the axes its product page switches on. */
export type CatalogListingDetail = {
  listing: CatalogListing;
  axes: VariantAxis[];
};

/** One item a storefront sells. */
export type CatalogListing = {
  /** The catalogue listing row. */
  id: string;
  /** What a site keys its own product record on — the variant's code, stable across sites. */
  code: string;
  name: string;
  price: Money;
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

export function createCatalogChannelsOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  /**
   * The currency the catalogue is read in.
   *
   * Not defaulted, for the same reason the basket does not default one: a listing priced only in
   * INR simply has no row in USD, so a guessed currency returns an empty shop rather than an error.
   */
  const currencyCode = (): string => {
    if (!currency) {
      throw new VapError(
        'This storefront has no selling currency — the workspace it resolved carries none.',
        'Not Configured',
        undefined,
      );
    }
    return currency;
  };
  return {
    /**
     * The currencies this shop can price in.
     *
     * Read before offering a switcher: the answer comes from the catalog the credential resolves to,
     * so a shop that prices only in one currency has nothing to switch and the control can stay hidden.
     * Needs no currency itself — it is the question a currency is chosen from.
     */
    async currencies(options: { scope?: WorkspaceScope; cacheSeconds?: number } = {}): Promise<string[]> {
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({ query: SITE_CATALOG_CURRENCIES_QUERY, context: requestContext });
          return requireData(r.data).siteCatalogCurrencies as string[];
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_CURRENCIES_QUERY, context: requestContext });
          return requireData(r.data).leCatalogCurrencies as string[];
        }
        const r = await client.query({ query: CATALOG_CURRENCIES_QUERY, context: requestContext });
        return requireData(r.data).catalogCurrencies as string[];
      });
    },

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
        currencyCode: currencyCode(),
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
     * One listing by code, with the axes its product page switches on.
     *
     * By code because that is what a storefront puts in its address bar: core's code already names
     * the offering and one value per dimension, so the URL says what the page is and needs no
     * second lookup to be readable.
     *
     * `null` is the honest answer to "does this shop sell it" — the row is absent from the
     * resolved catalogue, delisted, or excluded from this channel — and a page can say so rather
     * than guessing from a missing price.
     */
    async listingByCode(
      code: string,
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListingDetail | null> {
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      const variables = { code, currencyCode: currencyCode() };
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({
            query: SITE_CATALOG_LISTING_QUERY_BY_CODE,
            variables,
            context: requestContext,
          });
          return (requireData(r.data).siteCatalogListingByCode as CatalogListingDetail | null) ?? null;
        }
        if (scope === 'le') {
          const r = await client.query({ query: LE_CATALOG_LISTING_QUERY_BY_CODE, variables, context: requestContext });
          return (requireData(r.data).leCatalogListingByCode as CatalogListingDetail | null) ?? null;
        }
        const r = await client.query({ query: CATALOG_LISTING_QUERY_BY_CODE, variables, context: requestContext });
        return (requireData(r.data).catalogListingByCode as CatalogListingDetail | null) ?? null;
      });
    },

    /**
     * The same range, narrowed to the codes the caller already holds.
     *
     * For pricing rows a site stores itself — its own product pages, a saved basket — without pulling
     * the whole catalogue to price a handful of items. Anything the storefront may not sell is simply
     * absent from the result rather than erroring, so a stale local row resolves to "no longer sold".
     *
     * `filters` narrows that set further, with the same selections `listings` takes and the same
     * predicate behind them on core. It is what a band of filter tabs over a *curated* list needs —
     * "which of these bestsellers are ready to cook" — and the only way to ask it: filtering the
     * answer here instead would mean deciding what a dimension or an attribute means in a
     * storefront, which is core's to know.
     */
    async listingsByCodes(
      codes: string[],
      options: { scope?: WorkspaceScope; cacheSeconds?: number; filters?: ListingFilterSelection[] } = {},
    ): Promise<CatalogListing[]> {
      if (codes.length === 0) return [];
      const scope = options.scope ?? 'org';
      const ttlSeconds = options.cacheSeconds ?? DEFAULT_LISTINGS_CACHE_SECONDS;
      const requestContext = {
        requestContext: contextForScope(context, scope),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      const variables = { codes, currencyCode: currencyCode(), filters: options.filters };
      return run(async () => {
        if (scope === 'site') {
          const r = await client.query({
            query: SITE_CATALOG_LISTINGS_BY_CODES_QUERY,
            variables,
            context: requestContext,
          });
          return requireData(r.data).siteCatalogListingsByCodes as CatalogListing[];
        }
        if (scope === 'le') {
          const r = await client.query({
            query: LE_CATALOG_LISTINGS_BY_CODES_QUERY,
            variables,
            context: requestContext,
          });
          return requireData(r.data).leCatalogListingsByCodes as CatalogListing[];
        }
        const r = await client.query({
          query: CATALOG_LISTINGS_BY_CODES_QUERY,
          variables,
          context: requestContext,
        });
        return requireData(r.data).catalogListingsByCodes as CatalogListing[];
      });
    },
  };
}

export type CatalogChannelsOperations = ReturnType<typeof createCatalogChannelsOperations>;
