import {
  type UseInfiniteListReturn,
  useApolloInfiniteQuery,
  useRevalidateOnceFetchPolicy,
} from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { INVENTORY_ITEM_SUPPLIERS_QUERY } from '../../graphql/suppliers';
import type { Supplier } from '../../types/suppliers';

const PAGE_SIZE = 20;

// Relay infinite feed of an item's supplier links. `after` is the Relay cursor (undefined for page 1);
// inventoryItemId keys the cached connection (relayStylePagination keyArgs).
export function useSuppliersFeed(inventoryItemId: string): UseInfiniteListReturn<Supplier> {
  const getVariables = useCallback(
    (after: string | undefined) => ({ inventoryItemId, first: PAGE_SIZE, after }),
    [inventoryItemId],
  );

  // Revalidate over the network the first time this feed is shown in the session (so newly-added rows
  // appear despite a stale/empty persisted connection), then serve from cache on tab revisits — no
  // per-tab-switch refetch. Pull-to-refresh still forces a reload.
  const fetchPolicy = useRevalidateOnceFetchPolicy(`inventoryItemSuppliers:${inventoryItemId}`);

  return useApolloInfiniteQuery<Supplier>({
    query: INVENTORY_ITEM_SUPPLIERS_QUERY,
    getVariables,
    dataKey: 'inventoryItemSuppliers',
    enabled: !!inventoryItemId,
    fetchPolicy,
  });
}
