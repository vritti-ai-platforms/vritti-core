import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { AddSupplierInvoiceLineVars } from '@/schemas/supplier-invoices';
import { addSupplierInvoiceLine } from '@/services/site/supplier-invoices.service';

// Adds an item line to an invoice through its supplier and refreshes the site's invoices and purchase orders
export function useAddSupplierInvoiceLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, AddSupplierInvoiceLineVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, AddSupplierInvoiceLineVars>({
    ...options,
    mutationFn: addSupplierInvoiceLine,
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
