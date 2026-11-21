import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptCounts } from '@/schemas/goods-receipts';
import { getGoodsReceiptCounts } from '@/services/legal-entity/goods-receipts.service';
import { GOODS_RECEIPT_COUNTS_KEY } from './keys';

// Fetches how many items a goods receipt has, the count its breakdown and items cost tabs both list; under the
// receipt's key, so whatever refreshes the receipt refreshes them
export function useGoodsReceiptCounts(id: string) {
  return useQuery<GoodsReceiptCounts, AxiosError>({
    queryKey: GOODS_RECEIPT_COUNTS_KEY(id),
    queryFn: () => getGoodsReceiptCounts(id),
  });
}
