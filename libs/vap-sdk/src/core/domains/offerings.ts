import type { ApolloClient } from '@apollo/client';
import { SITE_OFFERING_VARIANTS_QUERY } from '../graphql/offerings';
import { requireData, run } from '../transport/errors';
import { contextForScope, type RequestContext } from '../types';

/** One variant a storefront may file a product page against. */
export type OfferingVariantOption = {
  id: string;
  sku: string;
  name: string;
};

export type OfferingVariantOptions = {
  items: OfferingVariantOption[];
  /** Matching variants across every page, after `excludeIds` */
  total: number;
};

/**
 * The products a storefront's own CMS points at.
 *
 * Separate from `catalogChannels`: that answers what the shop sells and for how much, this answers
 * what exists to be sold. A page is filed against a variant, which may happen before anyone lists it.
 *
 * Read only, and never cached by default — this is the picker staff file from, and a variant created
 * a moment ago belongs in it.
 */
export function createOfferingsOperations(client: ApolloClient, context: RequestContext = {}) {
  return {
    async variants(
      query: { search?: string; excludeIds?: string[]; limit?: number; offset?: number } = {},
      options: { cacheSeconds?: number } = {},
    ): Promise<OfferingVariantOptions> {
      const ttlSeconds = options.cacheSeconds ?? 0;
      const requestContext = {
        requestContext: contextForScope(context, 'site'),
        ...(ttlSeconds > 0 ? { responseCache: { ttlSeconds } } : {}),
      };
      return run(async () => {
        const r = await client.query({
          query: SITE_OFFERING_VARIANTS_QUERY,
          variables: {
            search: query.search,
            excludeIds: query.excludeIds,
            limit: query.limit,
            offset: query.offset,
          },
          context: requestContext,
        });
        return requireData(r.data).siteOfferingVariants as OfferingVariantOptions;
      });
    },
  };
}

export type OfferingsOperations = ReturnType<typeof createOfferingsOperations>;
