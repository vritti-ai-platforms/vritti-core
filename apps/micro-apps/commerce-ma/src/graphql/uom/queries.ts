import { graphql } from '../../gql';

// Relay keyset/cursor feed of a dimension's units (base + derived). relayStylePagination merges pages in
// the cache, keyed by dimensionId. Fixed sort (base units first, then name) is applied server-side.
export const UOMS_FEED_QUERY = graphql(`
  query UomsFeed($dimensionId: ID!, $first: Int, $after: String) {
    uomsFeed(dimensionId: $dimensionId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...UomFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

// Single unit by id (post-update re-fetch source).
export const UOM_QUERY = graphql(`
  query Uom($id: ID!) {
    uom(id: $id) {
      ...UomFields
    }
  }
`);
