import { useMutation } from '@apollo/client/react';
import { evictEntity } from '@vritti/quantum-ui-native/apollo';
import { DELETE_TAX_GROUP } from '../../../graphql/tax-groups';

// DELETE — confirm-first (no optimistic). Evict the entity; Apollo drops the dangling ref from the cached
// list array, so it disappears with no refetch. The client already holds the id.
export function useDeleteTaxGroup() {
  return useMutation(DELETE_TAX_GROUP, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      evictEntity({ cache, typename: 'TaxGroup', id });
    },
  });
}
