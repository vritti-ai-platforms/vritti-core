import { graphql } from '../../gql';

// Shared field set — reused by the list query and the create/update mutations so cached cost categories
// identity-merge by id.
export const CostCategoryFieldsFragment = graphql(`
  fragment CostCategoryFields on CostCategory {
    id
    code
    name
    kind
    isActive
    isSystem
    canDelete
  }
`);
