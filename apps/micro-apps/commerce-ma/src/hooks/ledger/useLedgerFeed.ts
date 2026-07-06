import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { INVENTORY_ITEM_LEDGER_QUERY } from '../../graphql/ledger';
import type { LedgerEntry } from '../../types/ledger';

const PAGE_SIZE = 20;

// Relay infinite feed of an item's ledger entries. `after` is the Relay cursor (undefined for page 1);
// inventoryItemId keys the cached connection (relayStylePagination keyArgs).
export function useLedgerFeed(inventoryItemId: string): UseInfiniteListReturn<LedgerEntry> {
  const getVariables = useCallback(
    (after: string | undefined) => ({ inventoryItemId, first: PAGE_SIZE, after }),
    [inventoryItemId],
  );

  // Revalidate over the network the first time this feed is shown in the session (so newly-added rows
  // appear despite a stale/empty persisted connection), then serve from cache on tab revisits — no
  // per-tab-switch refetch. Marked revalidated only on network success; reset on logout/BU switch.
  return useApolloInfiniteQuery<LedgerEntry>({
    query: INVENTORY_ITEM_LEDGER_QUERY,
    getVariables,
    dataKey: 'inventoryItemLedger',
    enabled: !!inventoryItemId,
    revalidateKey: `inventoryItemLedger:${inventoryItemId}`,
  });
}
