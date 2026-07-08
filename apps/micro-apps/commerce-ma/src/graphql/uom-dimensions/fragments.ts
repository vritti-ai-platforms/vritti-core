import { graphql } from '../../gql';

// Shared field set — reused by the list query, the single query, and the create/update mutations so cached
// dimensions identity-merge by id.
export const UomDimensionFieldsFragment = graphql(`
  fragment UomDimensionFields on UomDimension {
    id
    code
    name
    description
    canEdit
    canDelete
    createdAt
    updatedAt
  }
`);
