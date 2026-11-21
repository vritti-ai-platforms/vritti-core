import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseOrderNotesPayload } from '@/schemas/purchase-orders';
import { updatePurchaseOrderNotes } from '@/services/legal-entity/purchase-orders.service';

// Updates a purchase order's notes
export function useUpdatePurchaseOrderNotes(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseOrderNotesPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseOrderNotesPayload>({
    ...options,
    mutationFn: updatePurchaseOrderNotes,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseOrders]);
      options?.onSuccess?.(...args);
    },
  });
}
