import { type UseInfiniteListReturn, useApolloInfiniteQuery } from '@vritti/quantum-ui-native/hooks';
import { useCallback } from 'react';
import { GOODS_RECEIPTS_FEED_QUERY } from '../../../graphql/goods-receipts';
import type { GoodsReceipt } from '../../../types/goods-receipts';
import type { SearchState } from '../../../types/inventory-items';

const PAGE_SIZE = 20;

export interface UseGoodsReceiptsFeedParams {
  search: SearchState | null;
}

export function useGoodsReceiptsFeed({ search }: UseGoodsReceiptsFeedParams): UseInfiniteListReturn<GoodsReceipt> {
  // `after` is the Relay cursor (undefined for page 1); `search` keys the cached connection
  // (relayStylePagination keyArgs), so changing it resets the feed to page 1.
  const getVariables = useCallback((after: string | undefined) => ({ first: PAGE_SIZE, after, search }), [search]);

  return useApolloInfiniteQuery<GoodsReceipt>({
    query: GOODS_RECEIPTS_FEED_QUERY,
    getVariables,
    dataKey: 'goodsReceiptsFeed',
  });
}
