import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreatedPurchaseLegInboundDelivery, CreatePurchaseLegInboundDeliveryPayload } from '@/schemas/purchases';
import { createPurchaseLegInboundDelivery } from '@/services/legal-entity/purchases.service';

// Creates an inbound delivery of a supplier leg and refreshes the purchase's header, suppliers and sourcing items and the documents
export function useCreatePurchaseLegInboundDelivery(
  options?: Omit<
    UseMutationOptions<
      CreateResponse<CreatedPurchaseLegInboundDelivery>,
      AxiosError,
      CreatePurchaseLegInboundDeliveryPayload
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    CreateResponse<CreatedPurchaseLegInboundDelivery>,
    AxiosError,
    CreatePurchaseLegInboundDeliveryPayload
  >({
    ...options,
    mutationFn: createPurchaseLegInboundDelivery,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.inboundDeliveries,
        Tables.inboundDeliveryLines,
        Tables.purchaseSuppliers,
        Tables.purchases,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
