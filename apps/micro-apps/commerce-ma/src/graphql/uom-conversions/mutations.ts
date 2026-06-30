import { graphql } from '../../gql';

// Returns the full entity → the create hook prepends it into the cached list (no refetch).
export const CREATE_UOM_CONVERSION = graphql(`
  mutation CreateInventoryItemUomConversion($inventoryItemId: ID!, $input: CreateInventoryItemUomConversionInput!) {
    createInventoryItemUomConversion(inventoryItemId: $inventoryItemId, input: $input) {
      ...UomConversionFields
    }
  }
`);

// Returns success only — the update hook patches the cached entity (qty + derived factors are computable client-side).
export const UPDATE_UOM_CONVERSION = graphql(`
  mutation UpdateInventoryItemUomConversion($id: ID!, $input: UpdateInventoryItemUomConversionInput!) {
    updateInventoryItemUomConversion(id: $id, input: $input) {
      success
      message
    }
  }
`);

export const DELETE_UOM_CONVERSION = graphql(`
  mutation DeleteInventoryItemUomConversion($id: ID!) {
    deleteInventoryItemUomConversion(id: $id) {
      success
      message
    }
  }
`);
