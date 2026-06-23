import { useMutation } from '@apollo/client/react';
import { evictEntity, removeEdgeFromConnection } from '@vritti/quantum-ui-native/apollo';
import { DELETE_INVENTORY_ITEM } from '../../graphql/inventory-items';

// DELETE — confirm-first (no optimistic). Drop the edge from the cached connection(s) and evict the
// record so it disappears from every list at once, with ZERO refetch. The client already holds the id.
export function useDeleteInventoryItem() {
  return useMutation(DELETE_INVENTORY_ITEM, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      removeEdgeFromConnection({ cache, connectionField: 'inventoryItems', id });
      evictEntity({ cache, typename: 'InventoryItem', id });
    },
  });
}
