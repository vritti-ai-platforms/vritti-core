import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { getGoodsReceipt } from '@/services/goods-receipts.service';

export const GOODS_RECEIPT_KEY = (id: string) => ['commerce', 'goods-receipts', id] as const;

export function useGoodsReceipt(
  id: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<GoodsReceiptData, AxiosError>({
    queryKey: GOODS_RECEIPT_KEY(id ?? ''),
    queryFn: () => getGoodsReceipt(id as string),
    enabled: !!id,
    ...options,
  });
}
