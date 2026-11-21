import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { RequestedPurchaseQuotation, RequestPurchaseQuotationPayload } from '@/schemas/purchases';
import { requestPurchaseQuotation } from '@/services/legal-entity/purchases.service';

// Opens a draft quotation for a supplier on a purchase and refreshes the purchase's header, quotations and the supplier's quotations
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
      invalidateWrites(queryClient, [Tables.supplierQuotations, Tables.supplierQuotationItems]);
      options?.onSuccess?.(...args);
    },
  });
}
