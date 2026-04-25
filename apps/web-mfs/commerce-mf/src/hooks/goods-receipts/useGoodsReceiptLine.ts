import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemData } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemById } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEM_KEY } from './keys';

export function useGoodsReceiptItem(
  id: string | null,
  itemId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptItemData, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptItemData, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEM_KEY(id ?? '', itemId ?? ''),
    queryFn: () => getGoodsReceiptItemById(id as string, itemId as string),
    enabled: !!id && !!itemId,
    ...options,
  });
}
