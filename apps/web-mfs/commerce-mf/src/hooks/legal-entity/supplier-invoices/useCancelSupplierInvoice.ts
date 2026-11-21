import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { cancelSupplierInvoice } from '@/services/legal-entity/supplier-invoices.service';

// Cancels an invoice and refreshes the legal entity's invoices and purchase orders
export function useCancelSupplierInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SupplierInvoiceRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SupplierInvoiceRef>({
    ...options,
    mutationFn: cancelSupplierInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.purchaseOrderItems,
        Tables.purchaseOrders,
        Tables.inventoryItemQuants,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
        Tables.supplierInvoiceLines,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
