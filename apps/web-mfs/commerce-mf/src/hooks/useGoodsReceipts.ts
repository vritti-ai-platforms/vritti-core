import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/purchase-orders';
import { getGoodsReceipts } from '@/services/purchase-orders.service';

// Fetches goods receipts for a purchase order
export function useGoodsReceipts(
  poId: string | null,
  options?: Omit<UseQueryOptions<GoodsReceiptData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<GoodsReceiptData[], AxiosError>({
    queryKey: ['commerce', 'goods-receipts', poId],
    queryFn: () => getGoodsReceipts(poId as string),
    enabled: !!poId,
    ...options,
  });
}
