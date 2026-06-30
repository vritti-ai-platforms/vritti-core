import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { INVENTORY_ITEM_STOCK_LEVELS_QUERY } from '../../graphql/stock-levels';
import type { StockLevel } from '../../types/stock-levels';

const PAGE_SIZE = 20;

// Relay infinite feed of an item's per-location stock levels. `after` is the Relay cursor (undefined for
// page 1); inventoryItemId keys the cached connection (relayStylePagination keyArgs).
export function useStockLevelsFeed(inventoryItemId: string): UseInfiniteListReturn<StockLevel> {
  const getVariables = useCallback(
    (after: string | undefined) => ({ inventoryItemId, first: PAGE_SIZE, after }),
    [inventoryItemId],
  );

  return useApolloInfiniteQuery<StockLevel>({
    query: INVENTORY_ITEM_STOCK_LEVELS_QUERY,
    getVariables,
    dataKey: 'inventoryItemStockLevels',
    enabled: !!inventoryItemId,
  });
}
