import { graphql } from '../gql/index.js';

export const SITE_OFFERING_VARIANTS_QUERY = graphql(`
  query SiteOfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {
    siteOfferingVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {
      items {
        id
        code
        name
      }
      total
    }
  }
`);
