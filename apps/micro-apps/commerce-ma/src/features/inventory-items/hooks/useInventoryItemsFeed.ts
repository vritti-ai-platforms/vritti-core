// TODO(graphql-migration): migrate this feed to Apollo. commerce-ma is moving to Apollo Client,
// but the inventory feed still uses TanStack via quantum-ui-native's `useInfiniteList` + the REST
// `commerce-api/inventory-items/feed`. Converting it needs (1) an `inventoryItemsFeed` GraphQL
// query on core-server (not built yet) and (2) quantum's `useInfiniteList` reworked on Apollo.
// Deferred for now — this hook stays on REST + TanStack.
import { type UseInfiniteListReturn, useInfiniteList } from '@vritti/quantum-ui-native/hooks';
import type { FilterCondition, InventoryItem, SearchState, SortCondition } from '../../../types/list';
import { listInventoryItems } from '../services/inventory-items.service';

export const INVENTORY_ITEMS_FEED_KEY = ['commerce', 'inventory-items', 'feed'] as const;

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
  return useInfiniteList<InventoryItem>({
    queryKey: [...INVENTORY_ITEMS_FEED_KEY, { filters, search, sort }],
    fetchPage: (cursor) => listInventoryItems({ filters, search, sort, limit: PAGE_SIZE, cursor }),
    // Drop the cache when the feature unmounts (bottom-nav tab switch) → returning reloads only p1.
    // Within the feature the list stays mounted, so the query stays active and the cache is kept.
    gcTime: 0,
  });
}
