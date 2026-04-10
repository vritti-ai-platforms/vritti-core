import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { getPurchaseOrder } from '@/services/purchase-orders.service';

// Fetches purchase order detail with line items
export function usePurchaseOrder(
  id: string | null,
  options?: Omit<UseQueryOptions<PurchaseOrderDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PurchaseOrderDetail, AxiosError>({
    queryKey: ['commerce', 'purchase-orders', id],
    queryFn: () => getPurchaseOrder(id as string),
    enabled: !!id,
    ...options,
  });
}
