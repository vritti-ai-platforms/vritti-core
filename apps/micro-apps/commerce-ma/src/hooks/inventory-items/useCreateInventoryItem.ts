import { useMutation } from '@apollo/client/react';
import { prependEdgeToConnection } from '@vritti/quantum-ui-native/apollo';
import { CREATE_INVENTORY_ITEM } from '../../graphql/inventory-items';

// CREATE — prepend the created item's edge into the cached feed connection(s) so the list updates with
// ZERO refetch (relayStylePagination owns pagination; we only patch membership). The mutation returns the
// full entity, which Apollo auto-normalizes by id.
export function useCreateInventoryItem() {
  return useMutation(CREATE_INVENTORY_ITEM, {
    update(cache, { data }) {
      const created = data?.createInventoryItem;
      if (created) {
        prependEdgeToConnection({ cache, connectionField: 'inventoryItems', entity: created, edgeTypename: 'InventoryItemEdge' });
      }
    },
  });
}
