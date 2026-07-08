import { graphql } from '../../gql';

// Returns the full entity → the create hook prepends it into the cached list (no refetch).
export const CREATE_UOM_DIMENSION = graphql(`
  mutation CreateUomDimension($input: CreateUomDimensionInput!) {
    createUomDimension(input: $input) {
      ...UomDimensionFields
    }
  }
`);

// Returns the full entity → Apollo auto-merges by id (no surgery needed).
export const UPDATE_UOM_DIMENSION = graphql(`
  mutation UpdateUomDimension($id: ID!, $input: UpdateUomDimensionInput!) {
    updateUomDimension(id: $id, input: $input) {
      ...UomDimensionFields
    }
  }
`);

export const DELETE_UOM_DIMENSION = graphql(`
  mutation DeleteUomDimension($id: ID!) {
    deleteUomDimension(id: $id) {
      success
      message
    }
  }
`);
