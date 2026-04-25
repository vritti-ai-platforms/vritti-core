import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptBatchData } from '@/schemas/goods-receipts';
import { getGoodsReceiptBatches } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_BATCHES_KEY } from './keys';

export function useGoodsReceiptBatches(
  id: string | null,
  itemId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptBatchData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptBatchData[], AxiosError>({
    queryKey: GOODS_RECEIPT_BATCHES_KEY(id ?? '', itemId ?? ''),
    queryFn: () => getGoodsReceiptBatches(id as string, itemId as string),
    enabled: !!id && !!itemId,
    ...options,
  });
}
