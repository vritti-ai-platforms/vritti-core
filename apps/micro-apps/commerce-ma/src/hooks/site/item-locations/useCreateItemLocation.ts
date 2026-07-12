import { useMutation } from '@apollo/client/react';
import { prependEdgeToConnection } from '@vritti/quantum-ui-native/apollo';
import { CREATE_ITEM_LOCATION } from '../../../graphql/item-locations';

// CREATE — prepend the created config's edge into the cached feed connection (no refetch). The mutation
// returns the full entity, which Apollo auto-normalizes by id.
export function useCreateItemLocation() {
  return useMutation(CREATE_ITEM_LOCATION, {
    update(cache, { data }) {
      const created = data?.createInventoryItemLocation;
      if (created) {
        prependEdgeToConnection({
          cache,
          connectionField: 'inventoryItemLocations',
          entity: created,
          edgeTypename: 'InventoryItemLocationEdge',
        });
      }
    },
  });
}
