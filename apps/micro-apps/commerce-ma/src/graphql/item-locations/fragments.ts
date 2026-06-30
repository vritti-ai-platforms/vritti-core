import { graphql } from '../../gql';

// Shared field set for an inventory item's location configs — reused by the feed + create mutation so cached
// records identity-merge by id.
export const ItemLocationFieldsFragment = graphql(`
  fragment ItemLocationFields on InventoryItemLocation {
    id
    inventoryItemId
    locationId
    locationName
    locationPath
    reorderLevel
  }
`);
