import { graphql } from '../../gql';

// Relay feed of an item's location configs (cache-managed pagination via relayStylePagination, keyed by
// inventoryItemId).
export const INVENTORY_ITEM_LOCATIONS_QUERY = graphql(`
  query InventoryItemLocations($inventoryItemId: ID!, $first: Int, $after: String) {
    inventoryItemLocations(inventoryItemId: $inventoryItemId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...ItemLocationFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
