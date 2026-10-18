import type { ApolloClient } from '@apollo/client';
import { SITE_OFFERING_VARIANTS_QUERY } from '../graphql/offerings.js';
import { requireData, run } from '../transport/errors.js';
import { contextForScope, type RequestContext } from '../types.js';

export type OfferingVariantOption = {
  id: string;
  code: string;
  name: string;
};

export type OfferingVariantOptions = {
  items: OfferingVariantOption[];
  total: number;
};

// The products a storefront's own CMS points at.
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
