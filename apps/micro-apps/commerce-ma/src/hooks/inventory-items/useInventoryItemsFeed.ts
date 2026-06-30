import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import type { FilterCondition, InventoryItem, SearchState, SortCondition } from '../../types/inventory-items';
import { INVENTORY_ITEMS_QUERY } from '../../graphql/inventory-items';

const PAGE_SIZE = 20;

export interface UseInventoryItemsFeedParams {
  filters: FilterCondition[];
  search: SearchState | null;
  sort: SortCondition[];
}

export function useInventoryItemsFeed({
  filters,
  search,
  sort,
}: UseInventoryItemsFeedParams): UseInfiniteListReturn<InventoryItem> {
  // `after` is the Relay cursor (undefined for page 1); filters/search/sort key the cached
  // connection (relayStylePagination keyArgs), so changing them resets the feed to page 1.
  const getVariables = useCallback(
    (after: string | undefined) => ({ first: PAGE_SIZE, after, filters, search, sort }),
    [filters, search, sort],
  );

  return useApolloInfiniteQuery<InventoryItem>({
    query: INVENTORY_ITEMS_QUERY,
    getVariables,
    dataKey: 'inventoryItems',
  });
}
