import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { RejectPurchaseLegPayload } from '@/schemas/purchases';
import { rejectPurchaseLeg } from '@/services/site/purchases.service';

// Rejects a supplier leg of a purchase back to sourcing and refreshes the purchase's header, suppliers and sourcing items
export function useRejectPurchaseLeg(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, RejectPurchaseLegPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, RejectPurchaseLegPayload>({
    ...options,
    mutationFn: rejectPurchaseLeg,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.purchaseSuppliers]);
      options?.onSuccess?.(...args);
    },
  });
}
