import { useMutation } from '@apollo/client/react';
import { UPDATE_ITEM_LOCATION } from '../../../graphql/item-locations';

// UPDATE — the mutation returns success only, so patch the normalized entity's reorderLevel directly by id
// (no refetch; every view holding this config updates).
export function useUpdateItemLocation() {
  return useMutation(UPDATE_ITEM_LOCATION, {
    update(cache, _result, { variables }) {
      if (!variables) return;
      const { id, input } = variables;
      cache.modify({
        id: cache.identify({ __typename: 'InventoryItemLocation', id }),
        fields: {
          reorderLevel: () => input.reorderLevel,
        },
      });
    },
  });
}
