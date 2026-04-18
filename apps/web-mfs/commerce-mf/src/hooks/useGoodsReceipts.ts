import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import { getPurchaseOrderGoodsReceiptsTable } from '@/services/purchase-orders.service';

export const GOODS_RECEIPTS_KEY = (poId: string) => ['commerce', 'goods-receipts', poId, 'table'] as const;

// Fetches goods receipts for a purchase order
export function useGoodsReceipts(
  poId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<GoodsReceiptsTableResponse, AxiosError>({
    queryKey: GOODS_RECEIPTS_KEY(poId ?? ''),
    queryFn: () => getPurchaseOrderGoodsReceiptsTable(poId as string),
    enabled: options?.enabled ?? !!poId,
    ...options,
  });
}
