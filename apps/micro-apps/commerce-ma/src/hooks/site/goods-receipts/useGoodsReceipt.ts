import { useQuery } from '@apollo/client/react';
import { GOODS_RECEIPT_QUERY } from '../../../graphql/goods-receipts';
import type { GoodsReceiptQueryData } from '../../../types/goods-receipts';

// Single GR — cache-only: the entity is already cached from the feed (same GoodsReceiptFields fragment) via
// the Query.goodsReceipt by-id read redirect, so the detail reads it without a network round-trip.
export function useGoodsReceipt(id: string | undefined) {
  return useQuery<GoodsReceiptQueryData>(GOODS_RECEIPT_QUERY, {
    variables: { id: id ?? '' },
    skip: !id,
    fetchPolicy: 'cache-only',
  });
}
