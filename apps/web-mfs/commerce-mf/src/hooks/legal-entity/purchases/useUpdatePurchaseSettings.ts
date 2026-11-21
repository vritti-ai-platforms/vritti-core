import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdatePurchaseSettingsPayload } from '@/schemas/purchases';
import { updatePurchaseSettings } from '@/services/legal-entity/purchases.service';

// Sets one of the legal entity's sites' purchasing rules and refreshes the list of them
export function useUpdatePurchaseSettings(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseSettingsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseSettingsPayload>({
    ...options,
    mutationFn: updatePurchaseSettings,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.sitePurchasingSettings]);
      options?.onSuccess?.(...args);
    },
  });
}
