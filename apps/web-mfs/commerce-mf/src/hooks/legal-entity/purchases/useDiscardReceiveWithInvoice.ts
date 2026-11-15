import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { discardReceiveWithInvoice } from '@/services/legal-entity/purchases.service';
import { PURCHASE_DOCUMENT_KEYS, PURCHASES_KEY } from './keys';

// Discards a draft Receive with Invoice and refreshes the purchases and their documents
export function useDiscardReceiveWithInvoice(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: discardReceiveWithInvoice,
    onSuccess: (...args) => {
      for (const queryKey of [PURCHASES_KEY, ...PURCHASE_DOCUMENT_KEYS]) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
