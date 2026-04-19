import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseOrderData } from '@/schemas/purchase-orders';
import { type CreatePurchaseOrderPayload, createPurchaseOrder } from '@/services/purchase-orders.service';
import { PURCHASE_ORDERS_TABLE_KEY } from './usePurchaseOrdersTable';

// Creates a new purchase order and invalidates the table
export function useCreatePurchaseOrder(
  options?: Omit<UseMutationOptions<PurchaseOrderData, AxiosError, CreatePurchaseOrderPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<PurchaseOrderData, AxiosError, CreatePurchaseOrderPayload>({
    ...options,
    mutationFn: createPurchaseOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_ORDERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
