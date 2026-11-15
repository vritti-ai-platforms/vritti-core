import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateReceiveWithInvoiceVars } from '@/schemas/receive-with-invoices';
import { updateReceiveWithInvoice } from '@/services/legal-entity/purchases.service';
import { PURCHASE_DOCUMENT_KEYS, PURCHASES_KEY } from './keys';

// Replaces a draft Receive with Invoice and refreshes the purchases and their documents
export function useUpdateReceiveWithInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateReceiveWithInvoiceVars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateReceiveWithInvoiceVars>({
    ...options,
    mutationFn: updateReceiveWithInvoice,
    onSuccess: (...args) => {
      for (const queryKey of [PURCHASES_KEY, ...PURCHASE_DOCUMENT_KEYS]) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
