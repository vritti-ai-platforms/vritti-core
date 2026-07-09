import { graphql } from '../../gql';

// Returns the full entity → the create hook prepends it into the cached list (no refetch).
export const CREATE_TAX_GROUP = graphql(`
  mutation CreateTaxGroup($input: CreateTaxGroupInput!) {
    createTaxGroup(input: $input) {
      ...TaxGroupFields
    }
  }
`);

// Returns the full entity (re-read server-side) → Apollo auto-merges by id (no surgery needed).
export const UPDATE_TAX_GROUP = graphql(`
  mutation UpdateTaxGroup($id: ID!, $input: UpdateTaxGroupInput!) {
    updateTaxGroup(id: $id, input: $input) {
      ...TaxGroupFields
    }
  }
`);

export const DELETE_TAX_GROUP = graphql(`
  mutation DeleteTaxGroup($id: ID!) {
    deleteTaxGroup(id: $id) {
      success
      message
    }
  }
`);
