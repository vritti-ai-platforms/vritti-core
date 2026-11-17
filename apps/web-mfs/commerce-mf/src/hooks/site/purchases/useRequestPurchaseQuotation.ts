import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { RequestedPurchaseQuotation, RequestPurchaseQuotationPayload } from '@/schemas/purchases';
import { requestPurchaseQuotation } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Opens a draft quotation for a supplier on a purchase and refreshes the purchase's header, quotations
export function useRequestPurchaseQuotation(
  options?: Omit<
    UseMutationOptions<CreateResponse<RequestedPurchaseQuotation>, AxiosError, RequestPurchaseQuotationPayload>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<RequestedPurchaseQuotation>, AxiosError, RequestPurchaseQuotationPayload>({
    ...options,
    mutationFn: requestPurchaseQuotation,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
