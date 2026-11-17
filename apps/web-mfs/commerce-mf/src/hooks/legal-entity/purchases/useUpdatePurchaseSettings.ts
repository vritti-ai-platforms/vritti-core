import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdatePurchaseSettingsPayload } from '@/schemas/purchases';
import { updatePurchaseSettings } from '@/services/legal-entity/purchases.service';
import { PURCHASE_SETTINGS_KEY } from './keys';

// Sets one of the legal entity's sites' purchasing rules and refreshes the list of them
export function useUpdatePurchaseSettings(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdatePurchaseSettingsPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdatePurchaseSettingsPayload>({
    ...options,
    mutationFn: updatePurchaseSettings,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: PURCHASE_SETTINGS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
