import { graphql } from '../../gql';

// Read-only Relay feed of an item's per-location stock levels (cache-managed pagination via
// relayStylePagination on the host cache, keyed by inventoryItemId).
export const INVENTORY_ITEM_STOCK_LEVELS_QUERY = graphql(`
  query InventoryItemStockLevels($inventoryItemId: ID!, $first: Int, $after: String) {
    inventoryItemStockLevels(inventoryItemId: $inventoryItemId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...StockLevelFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
