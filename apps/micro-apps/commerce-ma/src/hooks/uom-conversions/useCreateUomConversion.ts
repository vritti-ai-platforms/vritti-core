import { useMutation } from '@apollo/client/react';
import { CREATE_UOM_CONVERSION, INVENTORY_ITEM_UOM_CONVERSIONS_QUERY } from '../../graphql/uom-conversions';

// CREATE — prepend the returned entity into this item's cached conversion list (no refetch).
export function useCreateUomConversion(inventoryItemId: string) {
  return useMutation(CREATE_UOM_CONVERSION, {
    update(cache, { data }) {
      const created = data?.createInventoryItemUomConversion;
      if (!created) return;
      cache.updateQuery({ query: INVENTORY_ITEM_UOM_CONVERSIONS_QUERY, variables: { inventoryItemId } }, (prev) =>
        prev ? { inventoryItemUomConversions: [created, ...prev.inventoryItemUomConversions] } : prev,
      );
    },
  });
}
