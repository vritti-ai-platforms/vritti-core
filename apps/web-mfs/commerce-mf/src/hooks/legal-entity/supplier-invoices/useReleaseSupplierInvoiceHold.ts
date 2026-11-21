import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { ReleaseSupplierInvoiceHoldVars } from '@/schemas/supplier-invoices';
import { releaseSupplierInvoiceHold } from '@/services/legal-entity/supplier-invoices.service';

// Releases an open hold on an invoice and refreshes the legal entity's invoices and purchase orders
export function useReleaseSupplierInvoiceHold(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ReleaseSupplierInvoiceHoldVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ReleaseSupplierInvoiceHoldVars>({
    ...options,
    mutationFn: releaseSupplierInvoiceHold,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.supplierInvoiceHolds, Tables.supplierInvoices]);
      options?.onSuccess?.(...args);
    },
  });
}
