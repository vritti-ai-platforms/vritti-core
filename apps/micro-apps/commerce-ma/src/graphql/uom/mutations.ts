import { graphql } from '../../gql';

// Returns the full entity → the create hook prepends it into the cached list (no refetch).
export const CREATE_UOM = graphql(`
  mutation CreateUom($input: CreateUomInput!) {
    createUom(input: $input) {
      ...UomFields
    }
  }
`);

// Returns the full entity → Apollo auto-merges by id (no surgery needed).
export const UPDATE_UOM = graphql(`
  mutation UpdateUom($id: ID!, $input: UpdateUomInput!) {
    updateUom(id: $id, input: $input) {
      ...UomFields
    }
  }
`);

export const DELETE_UOM = graphql(`
  mutation DeleteUom($id: ID!) {
    deleteUom(id: $id) {
      success
      message
    }
  }
`);
