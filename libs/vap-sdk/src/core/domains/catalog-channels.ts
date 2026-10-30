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
import { cacheFor } from '../transport/response-cache-store.js';
import type { Money } from '../types.js';
import { contextForScope, type RequestContext, type WorkspaceScope } from '../types.js';

export type FilterKind = 'DIMENSION' | 'ATTRIBUTE';

export type ListingSort = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';

export type ListingFilter = {
  kind: FilterKind;
  code: string;
  name: string;
  sortOrder: number;
  values: { code: string; name: string; count: number }[];
};

export type ListingFilterSelection = { code: string; values: string[] };

export type ListingQuery = {
  filters?: ListingFilterSelection[];
  page?: number;
  perPage?: number;
  sort?: ListingSort;
};

export type CatalogListings = {
  items: CatalogListing[];
  total: number;
  page: number;
  perPage: number;
  filters: ListingFilter[];
};

export type VariantOption = {
  code: string;
  name: string;
  selected: boolean;
  variantCode: string | null;
};

export type VariantAxis = {
  code: string;
  name: string;
  sortOrder: number;
  options: VariantOption[];
};

export type CatalogListingDetail = {
  listing: CatalogListing;
  axes: VariantAxis[];
};

export type CatalogListing = {
  id: string;
  code: string;
  name: string;
  price: Money;
};

export function createCatalogChannelsOperations(client: ApolloClient, context: RequestContext = {}, currency?: string) {
  // The currency the catalogue is read in.
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
    // The currencies this shop can price in.
    async currencies(options: { scope?: WorkspaceScope; cacheSeconds?: number } = {}): Promise<string[]> {
      const scope = options.scope ?? 'org';
      const requestContext = {
        requestContext: contextForScope(context, scope),
        responseCache: cacheFor(options.cacheSeconds),
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

    // One page of what is sellable, delisted rows and channel exclusions already dropped, with the filter rail that
    // produced it.
    async listings(
      query: ListingQuery = {},
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListings> {
      const scope = options.scope ?? 'org';
      const requestContext = {
        requestContext: contextForScope(context, scope),
        responseCache: cacheFor(options.cacheSeconds),
      };
      const variables = {
        filters: query.filters,
        page: query.page,
        perPage: query.perPage,
        sort: query.sort,
        currencyCode: currencyCode(),
      };
      // Each scope is its own query on core, checked against its own permission — and the header sent is the one that
      // scope names, so the two always agree.
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

    // One listing by code, with the axes its product page switches on.
    async listingByCode(
      code: string,
      options: { scope?: WorkspaceScope; cacheSeconds?: number } = {},
    ): Promise<CatalogListingDetail | null> {
      const scope = options.scope ?? 'org';
      const requestContext = {
        requestContext: contextForScope(context, scope),
        responseCache: cacheFor(options.cacheSeconds),
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

    // The same range, narrowed to the codes the caller already holds.
    async listingsByCodes(
      codes: string[],
      options: { scope?: WorkspaceScope; cacheSeconds?: number; filters?: ListingFilterSelection[] } = {},
    ): Promise<CatalogListing[]> {
      if (codes.length === 0) return [];
      const scope = options.scope ?? 'org';
      const requestContext = {
        requestContext: contextForScope(context, scope),
        responseCache: cacheFor(options.cacheSeconds),
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
