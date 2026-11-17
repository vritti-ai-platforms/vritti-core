import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreatedPurchaseLegGoodsReceipt, CreatePurchaseLegGoodsReceiptPayload } from '@/schemas/purchases';
import { createPurchaseLegGoodsReceipt } from '@/services/legal-entity/purchases.service';
import { invalidatePurchase, PURCHASE_DOCUMENT_KEYS } from './keys';

// Starts a draft goods receipt of a supplier leg and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useCreatePurchaseLegGoodsReceipt(
  options?: Omit<
    UseMutationOptions<
      CreateResponse<CreatedPurchaseLegGoodsReceipt>,
      AxiosError,
      CreatePurchaseLegGoodsReceiptPayload
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<CreatedPurchaseLegGoodsReceipt>, AxiosError, CreatePurchaseLegGoodsReceiptPayload>({
    ...options,
    mutationFn: createPurchaseLegGoodsReceipt,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      for (const queryKey of PURCHASE_DOCUMENT_KEYS) queryClient.invalidateQueries({ queryKey });
      options?.onSuccess?.(...args);
    },
  });
}
