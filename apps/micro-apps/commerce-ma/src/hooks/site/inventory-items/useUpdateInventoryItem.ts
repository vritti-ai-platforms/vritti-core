import { useMutation } from '@apollo/client/react';
import { UPDATE_INVENTORY_ITEM } from '../../../graphql/inventory-items';

// UPDATE — the mutation returns the full entity, so Apollo merges it into InventoryItem:{id} and every
// view (list cell, detail) updates automatically. No cache surgery, no list refetch.
export function useUpdateInventoryItem() {
  return useMutation(UPDATE_INVENTORY_ITEM);
}
