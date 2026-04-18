import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptsTable } from '@/services/goods-receipts.service';

export const GOODS_RECEIPTS_TABLE_KEY = ['commerce', 'goods-receipts', 'table'] as const;

export function useGoodsReceiptsTable(
  options?: Omit<UseQueryOptions<GoodsReceiptsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptsTableResponse, AxiosError>({
    queryKey: [...GOODS_RECEIPTS_TABLE_KEY],
    queryFn: getGoodsReceiptsTable,
    ...options,
  });
}
