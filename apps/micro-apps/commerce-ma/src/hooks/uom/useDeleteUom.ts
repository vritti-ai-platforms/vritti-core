import { useMutation } from '@apollo/client/react';
import { evictEntity, removeEdgeFromConnection } from '@vritti/quantum-ui-native/apollo';
import { DELETE_UOM } from '../../graphql/uom';

// DELETE — confirm-first (no optimistic). Drop the edge from the cached feed connection(s) and evict the
// record so it disappears with no refetch. The client already holds the id.
export function useDeleteUom() {
  return useMutation(DELETE_UOM, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      removeEdgeFromConnection({ cache, connectionField: 'uomsFeed', id });
      evictEntity({ cache, typename: 'Uom', id });
    },
  });
}
