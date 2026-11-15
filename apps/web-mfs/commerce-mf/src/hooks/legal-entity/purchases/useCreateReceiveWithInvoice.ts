import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatedReceiveWithInvoice, ReceiveWithInvoicePayload } from '@/schemas/receive-with-invoices';
import { createReceiveWithInvoice } from '@/services/legal-entity/purchases.service';
import { PURCHASE_DOCUMENT_KEYS, PURCHASES_KEY } from './keys';

// Drafts a Receive with Invoice and refreshes the purchases and their documents
export function useCreateReceiveWithInvoice(
  options?: Omit<
    UseMutationOptions<CreateResponse<CreatedReceiveWithInvoice>, AxiosError, ReceiveWithInvoicePayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedReceiveWithInvoice>, AxiosError, ReceiveWithInvoicePayload>({
    ...options,
    mutationFn: createReceiveWithInvoice,
    onSuccess: (...args) => {
      for (const queryKey of [PURCHASES_KEY, ...PURCHASE_DOCUMENT_KEYS]) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
