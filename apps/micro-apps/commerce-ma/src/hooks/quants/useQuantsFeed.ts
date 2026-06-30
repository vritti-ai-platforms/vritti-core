import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { INVENTORY_ITEM_QUANTS_QUERY } from '../../graphql/quants';
import type { Quant } from '../../types/quants';

const PAGE_SIZE = 20;

// Relay infinite feed of an item's quants. `after` is the Relay cursor (undefined for page 1);
// inventoryItemId keys the cached connection (relayStylePagination keyArgs).
export function useQuantsFeed(inventoryItemId: string): UseInfiniteListReturn<Quant> {
  const getVariables = useCallback(
    (after: string | undefined) => ({ inventoryItemId, first: PAGE_SIZE, after }),
    [inventoryItemId],
  );

  return useApolloInfiniteQuery<Quant>({
    query: INVENTORY_ITEM_QUANTS_QUERY,
    getVariables,
    dataKey: 'inventoryItemQuants',
    enabled: !!inventoryItemId,
  });
}
