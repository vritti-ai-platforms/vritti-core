import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptItemsTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptItemsTable } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_ITEMS_TABLE_KEY } from './keys';

export function useGoodsReceiptItemsTable(
  id: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<GoodsReceiptItemsTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPT_ITEMS_TABLE_KEY(id ?? ''),
    queryFn: () => getGoodsReceiptItemsTable(id as string),
    enabled: !!id,
    ...options,
  });
}
