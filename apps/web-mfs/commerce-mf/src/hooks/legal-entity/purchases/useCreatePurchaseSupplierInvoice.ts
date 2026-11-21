import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedPurchaseSupplierInvoice, CreatePurchaseSupplierInvoicePayload } from '@/schemas/purchases';
import { createPurchaseSupplierInvoice } from '@/services/legal-entity/purchases.service';

// Drafts a supplier's invoice of its posted receipts and refreshes the purchases and their documents
export function useCreatePurchaseSupplierInvoice(
  options?: Omit<
    UseMutationOptions<
      CreateResponse<CreatedPurchaseSupplierInvoice>,
      AxiosError,
      CreatePurchaseSupplierInvoicePayload
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedPurchaseSupplierInvoice>, AxiosError, CreatePurchaseSupplierInvoicePayload>({
    ...options,
    mutationFn: createPurchaseSupplierInvoice,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.supplierInvoices,
        Tables.supplierInvoiceLines,
        Tables.supplierInvoiceHolds,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
