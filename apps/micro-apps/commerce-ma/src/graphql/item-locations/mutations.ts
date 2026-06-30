import { graphql } from '../../gql';

// Returns the full entity → the client prepends its edge into the cached feed (no refetch).
export const CREATE_ITEM_LOCATION = graphql(`
  mutation CreateInventoryItemLocation($inventoryItemId: ID!, $input: CreateInventoryItemLocationInput!) {
    createInventoryItemLocation(inventoryItemId: $inventoryItemId, input: $input) {
      ...ItemLocationFields
    }
  }
`);

// Returns success only — the client patches the cached entity's reorderLevel by id (no refetch).
export const UPDATE_ITEM_LOCATION = graphql(`
  mutation UpdateInventoryItemLocation($id: ID!, $input: UpdateInventoryItemLocationInput!) {
    updateInventoryItemLocation(id: $id, input: $input) {
      success
      message
    }
  }
`);

export const DELETE_ITEM_LOCATION = graphql(`
  mutation DeleteInventoryItemLocation($id: ID!) {
    deleteInventoryItemLocation(id: $id) {
      success
      message
    }
  }
`);
