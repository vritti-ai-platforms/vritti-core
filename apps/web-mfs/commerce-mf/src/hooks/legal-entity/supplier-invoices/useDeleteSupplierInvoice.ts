import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { SupplierInvoiceRef } from '@/schemas/supplier-invoices';
import { deleteSupplierInvoice } from '@/services/legal-entity/supplier-invoices.service';

// Deletes a draft invoice and refreshes the legal entity's invoices and purchase orders
export function useDeleteSupplierInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SupplierInvoiceRef>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, SupplierInvoiceRef>({
    ...options,
    mutationFn: deleteSupplierInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.supplierInvoiceLines,
        Tables.supplierInvoiceHolds,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
