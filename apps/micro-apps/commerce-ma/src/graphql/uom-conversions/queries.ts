import { graphql } from '../../gql';

// Per-item UOM conversion overrides — small/bounded, so a plain array (no relay pagination).
export const INVENTORY_ITEM_UOM_CONVERSIONS_QUERY = graphql(`
  query InventoryItemUomConversions($inventoryItemId: ID!) {
    inventoryItemUomConversions(inventoryItemId: $inventoryItemId) {
      ...UomConversionFields
    }
  }
`);
