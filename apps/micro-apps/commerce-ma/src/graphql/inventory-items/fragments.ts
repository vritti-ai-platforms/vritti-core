import { graphql } from '../../gql';

// Shared field set — reused by the feed, single-item query, and create/update mutations so every
// cached InventoryItem carries the same fields and identity-merge (by id) keeps list/detail/edit in sync.
export const InventoryItemFieldsFragment = graphql(`
  fragment InventoryItemFields on InventoryItem {
    id
    name
    code
    type
    tracking
    pickStrategy
    categoryId
    categoryName
    description
    uomId
    uomSymbol
    purchaseTaxGroupId
    hsnCode
    canDelete
    createdAt
    updatedAt
  }
`);
