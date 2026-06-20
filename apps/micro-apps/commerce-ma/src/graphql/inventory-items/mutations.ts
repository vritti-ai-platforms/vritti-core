import { graphql } from '../../gql';

// Returns the full entity → cache.modify prepends the new edge into the feed connection (no refetch).
export const CREATE_INVENTORY_ITEM = graphql(`
  mutation CreateInventoryItem($input: CreateInventoryItemInput!) {
    createInventoryItem(input: $input) {
      ...InventoryItemFields
    }
  }
`);

// Returns the full entity → Apollo auto-merges by id, so list + detail update with no refetch.
export const UPDATE_INVENTORY_ITEM = graphql(`
  mutation UpdateInventoryItem($id: ID!, $input: UpdateInventoryItemInput!) {
    updateInventoryItem(id: $id, input: $input) {
      ...InventoryItemFields
    }
  }
`);

export const DELETE_INVENTORY_ITEM = graphql(`
  mutation DeleteInventoryItem($id: ID!) {
    deleteInventoryItem(id: $id) {
      success
      message
    }
  }
`);
