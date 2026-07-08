import { graphql } from '../../gql';

// Shared field set — reused by the list query, single query, and create/update mutations so cached units
// identity-merge by id.
export const UomFieldsFragment = graphql(`
  fragment UomFields on Uom {
    id
    dimensionId
    name
    symbol
    baseUnitId
    baseUnitSymbol
    baseUomQty
    uomQty
    canEdit
    canDelete
    createdAt
  }
`);
