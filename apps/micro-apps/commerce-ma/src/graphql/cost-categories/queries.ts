import { graphql } from '../../gql';

// Cost categories list — small/bounded (org-scoped taxonomy), so a plain array. Optional search by name/code.
export const COST_CATEGORIES_QUERY = graphql(`
  query CostCategories($search: String) {
    costCategories(search: $search) {
      ...CostCategoryFields
    }
  }
`);
