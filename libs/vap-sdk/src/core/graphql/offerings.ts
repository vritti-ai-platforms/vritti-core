import { graphql } from '../gql/index.js';

export const OFFERING_VARIANTS_QUERY = graphql(`
  query OfferingVariants($search: String, $excludeIds: [ID!], $limit: Int, $offset: Int) {
    offeringVariants(search: $search, excludeIds: $excludeIds, limit: $limit, offset: $offset) {
      items {
        id
        code
      }
      total
    }
  }
`);
