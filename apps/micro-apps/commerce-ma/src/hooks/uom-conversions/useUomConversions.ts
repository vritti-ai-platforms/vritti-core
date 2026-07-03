import { useQuery } from '@apollo/client/react';
import { useRevalidateOnceFetchPolicy } from '@vritti/quantum-ui-native/hooks';
import { INVENTORY_ITEM_UOM_CONVERSIONS_QUERY } from '../../graphql/uom-conversions';

// Plain list of an item's UOM conversions (small/bounded — no infinite pagination). Revalidate once per
// session, then serve from cache on tab revisits (see useRevalidateOnceFetchPolicy) — matches the feed
// tabs so switching back here doesn't re-hit the API.
export function useUomConversions(inventoryItemId: string) {
  const fetchPolicy = useRevalidateOnceFetchPolicy(`inventoryItemUomConversions:${inventoryItemId}`);
  return useQuery(INVENTORY_ITEM_UOM_CONVERSIONS_QUERY, {
    variables: { inventoryItemId },
    skip: !inventoryItemId,
    fetchPolicy,
  });
}
