import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderCounts } from '@/schemas/purchase-orders';
import { getPurchaseOrderCounts } from '@/services/site/purchase-orders.service';
import { PURCHASE_ORDER_COUNTS_KEY } from './keys';

// Fetches how many lines a purchase order has and how many deliveries, receipts and invoices are on them, one per tab;
// under the order's key, so whatever refreshes the order refreshes them
export function usePurchaseOrderCounts(id: string) {
  return useQuery<PurchaseOrderCounts, AxiosError>({
    queryKey: PURCHASE_ORDER_COUNTS_KEY(id),
    queryFn: () => getPurchaseOrderCounts(id),
  });
}
