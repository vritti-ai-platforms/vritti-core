import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateSupplierInvoiceLineVars } from '@/schemas/supplier-invoices';
import { updateSupplierInvoiceLine } from '@/services/legal-entity/supplier-invoices.service';

// Updates a line of an invoice and refreshes the legal entity's invoices and purchase orders
export function useUpdateSupplierInvoiceLine(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierInvoiceLineVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierInvoiceLineVars>({
    ...options,
    mutationFn: updateSupplierInvoiceLine,
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
