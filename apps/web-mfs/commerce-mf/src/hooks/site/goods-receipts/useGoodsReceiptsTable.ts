import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import { getGoodsReceiptsTable } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPTS_TABLE_KEY } from './keys';

export function useGoodsReceiptsTable(
  options?: Omit<UseQueryOptions<GoodsReceiptsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptsTableResponse, AxiosError>({
    queryKey: [...GOODS_RECEIPTS_TABLE_KEY],
    queryFn: getGoodsReceiptsTable,
    ...options,
  });
}
