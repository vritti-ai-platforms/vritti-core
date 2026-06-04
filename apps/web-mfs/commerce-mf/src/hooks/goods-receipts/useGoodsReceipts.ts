import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptsTableResponse } from '@/schemas/goods-receipts';
import { getPurchaseOrderGoodsReceiptsTable } from '@/services/purchase-orders.service';
import { GOODS_RECEIPTS_KEY } from './keys';

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
