import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateSupplierInvoicePayload, SupplierInvoice } from '@/schemas/supplier-invoices';
import { createSupplierInvoice } from '@/services/site/supplier-invoices.service';

// Records a draft invoice from a supplier at the session site and refreshes the site's invoices and the supplier's tab
// counts
export function useCreateSupplierInvoice(
  options?: Omit<UseMutationOptions<SupplierInvoice, AxiosError, CreateSupplierInvoicePayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SupplierInvoice, AxiosError, CreateSupplierInvoicePayload>({
    ...options,
    mutationFn: createSupplierInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierInvoices]);
      options?.onSuccess?.(...args);
    },
  });
}
