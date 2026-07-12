import { useMutation } from '@apollo/client/react';
import { CREATE_TAX_GROUP, TAX_GROUPS_QUERY } from '../../../graphql/tax-groups';

// CREATE — prepend the returned entity into the cached (unfiltered) tax-group list (no refetch). An active
// search variant revalidates via cache-and-network on its next view.
export function useCreateTaxGroup() {
  return useMutation(CREATE_TAX_GROUP, {
    update(cache, { data }) {
      const created = data?.createTaxGroup;
      if (!created) return;
      cache.updateQuery({ query: TAX_GROUPS_QUERY, variables: { search: undefined } }, (prev) =>
        prev ? { taxGroups: [created, ...prev.taxGroups] } : prev,
      );
    },
  });
}
