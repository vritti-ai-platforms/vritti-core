import { graphql } from '../../gql';

// Read-only Relay feed of an item's ledger entries (cache-managed pagination via relayStylePagination on
// the host cache, keyed by inventoryItemId).
export const INVENTORY_ITEM_LEDGER_QUERY = graphql(`
  query InventoryItemLedger($inventoryItemId: ID!, $first: Int, $after: String) {
    inventoryItemLedger(inventoryItemId: $inventoryItemId, first: $first, after: $after) {
      edges {
        cursor
        node {
          ...LedgerEntryFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);
