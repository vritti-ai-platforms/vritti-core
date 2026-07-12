import { useMutation } from '@apollo/client/react';
import { COST_CATEGORIES_QUERY, CREATE_COST_CATEGORY } from '../../../graphql/cost-categories';

// CREATE — prepend the returned entity into the cached (unfiltered) list (no refetch). An active search
// variant revalidates via cache-and-network on its next view.
export function useCreateCostCategory() {
  return useMutation(CREATE_COST_CATEGORY, {
    update(cache, { data }) {
      const created = data?.createCostCategory;
      if (!created) return;
      cache.updateQuery({ query: COST_CATEGORIES_QUERY, variables: { search: undefined } }, (prev) =>
        prev ? { costCategories: [created, ...prev.costCategories] } : prev,
      );
    },
  });
}
