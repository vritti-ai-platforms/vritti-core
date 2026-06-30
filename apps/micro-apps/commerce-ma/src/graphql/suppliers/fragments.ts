import { graphql } from '../../gql';

// Shared field set for an inventory item's supplier links.
export const SupplierFieldsFragment = graphql(`
  fragment SupplierFields on InventoryItemSupplier {
    id
    supplierId
    supplierName
    supplierCode
    supplierItemCode
    unitPrice {
      currency
      value
    }
    uomId
    uomSymbol
    minOrderQuantity
    leadTimeDays
    isPreferred
    isActive
  }
`);
