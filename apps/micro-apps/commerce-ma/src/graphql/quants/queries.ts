import { graphql } from '../../gql';

// Read-only Relay feed of an item's quants (cache-managed pagination via relayStylePagination on the host
// cache, keyed by inventoryItemId).
export const INVENTORY_ITEM_QUANTS_QUERY = graphql(`
  query InventoryItemQuants($inventoryItemId: ID!, $first: Int, $after: String) {
    inventoryItemQuants(inventoryItemId: $inventoryItemId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...QuantFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
