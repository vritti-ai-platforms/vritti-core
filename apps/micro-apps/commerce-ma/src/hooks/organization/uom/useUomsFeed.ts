import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { usePermission } from '@vritti/quantum-ui-native/context';
import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { UOMS_FEED_QUERY } from '../../../graphql/uom';
import type { Uom } from '../../../types/uom';

const PAGE_SIZE = 20;

// Relay infinite feed of a dimension's units (base + derived). `after` is the Relay cursor (undefined for
// page 1); dimensionId keys the cached connection (relayStylePagination keyArgs). Disabled when the units
// view is plan-locked so a paywalled units list never hits the API (enabled → skip in useApolloInfiniteQuery).
export function useUomsFeed(dimensionId: string): UseInfiniteListReturn<Uom> {
  const { available } = usePermission(ORG_UOM.view);
  const getVariables = useCallback(
    (after: string | undefined) => ({ dimensionId, first: PAGE_SIZE, after }),
    [dimensionId],
  );

  // Revalidate over the network the first time this feed is shown in the session (so newly-added units
  // appear despite a stale/empty persisted connection), then serve from cache on revisits.
  return useApolloInfiniteQuery<Uom>({
    query: UOMS_FEED_QUERY,
    getVariables,
    dataKey: 'uomsFeed',
    enabled: !!dimensionId && available,
    revalidateKey: `uomsFeed:${dimensionId}`,
  });
}
