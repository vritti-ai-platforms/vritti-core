import { graphql } from '../../gql';

// Returns the full entity → the create hook prepends it into the cached list (no refetch).
export const CREATE_COST_CATEGORY = graphql(`
  mutation CreateCostCategory($input: CreateCostCategoryInput!) {
    createCostCategory(input: $input) {
      ...CostCategoryFields
    }
  }
`);

// Returns the full entity (server re-reads) → Apollo auto-merges by id. Also carries the activate/deactivate
// toggle via `input.isActive`.
export const UPDATE_COST_CATEGORY = graphql(`
  mutation UpdateCostCategory($id: ID!, $input: UpdateCostCategoryInput!) {
    updateCostCategory(id: $id, input: $input) {
      ...CostCategoryFields
    }
  }
`);

export const DELETE_COST_CATEGORY = graphql(`
  mutation DeleteCostCategory($id: ID!) {
    deleteCostCategory(id: $id) {
      success
      message
    }
  }
`);
