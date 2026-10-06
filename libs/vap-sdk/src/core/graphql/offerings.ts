import { graphql } from '../gql';

/**
 * Variants a storefront can point one of its own product pages at.
 *
 * Deliberately not catalogue-scoped: this answers "which variant is this page about", which a page
 * may settle before the variant is listed anywhere. Site scope only — the picker that uses it is one
 * outlet's website.
 *
 * `excludeIds` is applied by core rather than by the caller, so the list stays pageable: filtering a
 * page after it arrives can empty that page while matches sit on the next one, which reads as
 * "nothing left to file" and is indistinguishable from it.
 */
export const SITE_OFFERING_VARIANTS_QUERY = graphql(`
  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {
    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {
      items {
        id
        sku
        name
      }
      total
    }
  }
`);
