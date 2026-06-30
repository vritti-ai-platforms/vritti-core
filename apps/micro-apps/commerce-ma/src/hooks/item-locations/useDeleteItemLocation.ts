import { useMutation } from '@apollo/client/react';
import { evictEntity, removeEdgeFromConnection } from '@vritti/quantum-ui-native/apollo';
import { DELETE_ITEM_LOCATION } from '../../graphql/item-locations';

// DELETE — confirm-first (no optimistic). Drop the edge from the cached feed + evict the record so it
// disappears with no refetch. The client already holds the id.
export function useDeleteItemLocation() {
  return useMutation(DELETE_ITEM_LOCATION, {
    update(cache, _result, { variables }) {
      const id = variables?.id;
      if (!id) return;
      removeEdgeFromConnection({ cache, connectionField: 'inventoryItemLocations', id });
      evictEntity({ cache, typename: 'InventoryItemLocation', id });
    },
  });
}
