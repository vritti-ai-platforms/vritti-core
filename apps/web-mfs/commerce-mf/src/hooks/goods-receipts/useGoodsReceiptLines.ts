import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItems } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_KEY } from './keys';

export function useGoodsReceiptItems(
  id: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptItemData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptItemData[], AxiosError>({
    queryKey: GOODS_RECEIPT_ITEMS_KEY(id ?? ''),
    queryFn: () => getGoodsReceiptItems(id as string),
    enabled: !!id,
    ...options,
  });
}
