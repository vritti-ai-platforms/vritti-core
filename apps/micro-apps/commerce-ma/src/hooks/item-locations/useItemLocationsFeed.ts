import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { INVENTORY_ITEM_LOCATIONS_QUERY } from '../../graphql/item-locations';
import type { ItemLocation } from '../../types/item-locations';

const PAGE_SIZE = 20;

// Relay infinite feed of an item's location configs. `after` is the Relay cursor (undefined for page 1);
// inventoryItemId keys the cached connection (relayStylePagination keyArgs).
export function useItemLocationsFeed(inventoryItemId: string): UseInfiniteListReturn<ItemLocation> {
  const getVariables = useCallback(
    (after: string | undefined) => ({ inventoryItemId, first: PAGE_SIZE, after }),
    [inventoryItemId],
  );

  return useApolloInfiniteQuery<ItemLocation>({
    query: INVENTORY_ITEM_LOCATIONS_QUERY,
    getVariables,
    dataKey: 'inventoryItemLocations',
    enabled: !!inventoryItemId,
  });
}
