import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { getPurchaseOrder } from '@/services/purchase-orders.service';

export const PURCHASE_ORDER_KEY = (id: string) => ['commerce', 'purchase-orders', id] as const;

// Fetches purchase order header/detail
export function usePurchaseOrder(id: string) {
  return useSuspenseQuery<PurchaseOrderDetail, AxiosError>({
    queryKey: PURCHASE_ORDER_KEY(id),
    queryFn: () => getPurchaseOrder(id),
  });
}
