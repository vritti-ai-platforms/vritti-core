import { useQuery } from '@apollo/client/react';
import { INVENTORY_ITEM_UOM_CONVERSIONS_QUERY } from '../../graphql/uom-conversions';

// Plain list of an item's UOM conversions (small/bounded — no infinite pagination).
export function useUomConversions(inventoryItemId: string) {
  return useQuery(INVENTORY_ITEM_UOM_CONVERSIONS_QUERY, {
    variables: { inventoryItemId },
    skip: !inventoryItemId,
  });
}
