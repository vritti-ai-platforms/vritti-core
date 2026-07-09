import { useMutation } from '@apollo/client/react';
import { evictEntity } from '@vritti/quantum-ui-native/apollo';
import { DELETE_COST_CATEGORY } from '../../graphql/cost-categories';

// DELETE — confirm-first (no optimistic). Evict the entity; Apollo drops the dangling ref from the cached
// list array, so it disappears with no refetch. The client already holds the id.
export function useDeleteCostCategory() {
  return useMutation(DELETE_COST_CATEGORY, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      evictEntity({ cache, typename: 'CostCategory', id });
    },
  });
}
