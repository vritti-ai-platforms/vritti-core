import type { ApolloClient } from '@apollo/client';
import { CATALOG_LISTINGS_QUERY } from '../graphql/catalog';
import { requireData, run } from '../transport/errors';
import type { RequestContext } from '../types';
import type { Money } from './shopper';

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
export function createCatalogOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    /**
     * Everything sellable, delisted rows and channel exclusions already dropped.
     *
     * So a CMS filing a page against one of these cannot key it to something the shop cannot sell.
     */
    listings(): Promise<CatalogListing[]> {
      return run(() =>
        client
          .query({ query: CATALOG_LISTINGS_QUERY, context: requestContext })
          .then((r) => requireData(r.data).catalogListings as CatalogListing[]),
      );
    },
  };
}

export type CatalogOperations = ReturnType<typeof createCatalogOperations>;
