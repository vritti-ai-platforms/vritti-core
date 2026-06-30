import { graphql } from '../../gql';

// Shared field set for an inventory item's quants (physical stock segments).
export const QuantFieldsFragment = graphql(`
  fragment QuantFields on InventoryItemQuant {
    id
    locationId
    locationName
    locationPath
    lotId
    lotNumber
    quantity
    reservedQuantity
    availableQuantity
    manufacturingDate
    expiryDate
    createdAt
  }
`);
