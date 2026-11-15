import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatedPurchaseSupplierInvoice, CreatePurchaseSupplierInvoicePayload } from '@/schemas/purchases';
import { createPurchaseSupplierInvoice } from '@/services/site/purchases.service';
import { PURCHASE_DOCUMENT_KEYS, PURCHASES_KEY } from './keys';

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
      for (const queryKey of [PURCHASES_KEY, ...PURCHASE_DOCUMENT_KEYS]) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
