import { graphql } from '../../gql';

// Relay-connection feed (cache-managed pagination via relayStylePagination on the host cache).
export const INVENTORY_ITEMS_QUERY = graphql(`
  query InventoryItems(
    $first: Int
    $after: String
    $filters: [FeedFilterInput!]
    $search: FeedSearchInput
    $sort: [FeedSortInput!]
  ) {
    inventoryItems(first: $first, after: $after, filters: $filters, search: $search, sort: $sort) {
      edges {
        cursor
        node {
          ...InventoryItemFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

// Single item — read cache-only on the detail/edit screens (resolved from the feed-cached entity via
// the Query.inventoryItem cache redirect on the host).
export const INVENTORY_ITEM_QUERY = graphql(`
  query InventoryItem($id: ID!) {
    inventoryItem(id: $id) {
      ...InventoryItemFields
    }
  }
`);
