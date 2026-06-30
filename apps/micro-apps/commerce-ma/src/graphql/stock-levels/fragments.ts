import { graphql } from '../../gql';

// Shared field set for an inventory item's per-location stock levels.
export const StockLevelFieldsFragment = graphql(`
  fragment StockLevelFields on InventoryItemStockLevel {
    id
    locationId
    locationName
    locationPath
    stockedQuantity
    reservedQuantity
    availableQuantity
    reorderLevel
  }
`);
