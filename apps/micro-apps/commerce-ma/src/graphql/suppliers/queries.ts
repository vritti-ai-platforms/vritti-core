import { graphql } from '../../gql';

// Read-only Relay feed of an item's supplier links (cache-managed pagination via relayStylePagination,
// keyed by inventoryItemId).
export const INVENTORY_ITEM_SUPPLIERS_QUERY = graphql(`
  query InventoryItemSuppliers($inventoryItemId: ID!, $first: Int, $after: String) {
    inventoryItemSuppliers(inventoryItemId: $inventoryItemId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...SupplierFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
