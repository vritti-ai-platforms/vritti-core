import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptBatchItemData } from '@/schemas/goods-receipts';
import { getGoodsReceiptBatchItems } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_BATCH_ITEMS_KEY } from './keys';

export function useGoodsReceiptBatchItems(
  id: string | null,
  itemId: string | null,
  batchId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptBatchItemData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptBatchItemData[], AxiosError>({
    queryKey: GOODS_RECEIPT_BATCH_ITEMS_KEY(id ?? '', itemId ?? '', batchId ?? ''),
    queryFn: () => getGoodsReceiptBatchItems(id as string, itemId as string, batchId as string),
    enabled: !!id && !!itemId && !!batchId,
    ...options,
  });
}
