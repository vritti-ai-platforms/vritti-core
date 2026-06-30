import { graphql } from '../../gql';

// Shared field set — reused by the list query and the create mutation so cached conversions identity-merge by id.
export const UomConversionFieldsFragment = graphql(`
  fragment UomConversionFields on InventoryItemUomConversion {
    id
    inventoryItemId
    uomId
    uomName
    uomSymbol
    primaryUomQty
    uomQty
    toPrimaryConversionFactor
    toUomConversionFactor
    canEdit
    canDelete
    createdAt
    updatedAt
  }
`);
