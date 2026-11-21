import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { RemoveSupplierInvoiceLineVars } from '@/schemas/supplier-invoices';
import { removeSupplierInvoiceLine } from '@/services/site/supplier-invoices.service';

// Removes a line from an invoice through its supplier and refreshes the site's invoices and purchase orders
export function useRemoveSupplierInvoiceLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, RemoveSupplierInvoiceLineVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, RemoveSupplierInvoiceLineVars>({
    ...options,
    mutationFn: removeSupplierInvoiceLine,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoiceLines,
        Tables.supplierInvoices,
        Tables.supplierInvoiceHolds,
        Tables.purchaseOrderItems,
        Tables.purchaseOrders,
        Tables.inventoryItemQuants,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
