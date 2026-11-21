import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateSupplierInvoiceVars } from '@/schemas/supplier-invoices';
import { updateSupplierInvoice } from '@/services/site/supplier-invoices.service';

// Updates an invoice's header through its supplier and refreshes the site's invoices and purchase orders
export function useUpdateSupplierInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSupplierInvoiceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateSupplierInvoiceVars>({
    ...options,
    mutationFn: updateSupplierInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.supplierInvoiceHolds,
        Tables.supplierInvoiceLines,
        Tables.inventoryItemQuants,
        Tables.inventoryItemCosts,
        Tables.inventoryItemQuantCosts,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
