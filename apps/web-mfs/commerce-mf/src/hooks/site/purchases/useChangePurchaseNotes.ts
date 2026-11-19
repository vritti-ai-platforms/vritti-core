import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ChangePurchaseNotesPayload } from '@/schemas/purchases';
import { changePurchaseNotes } from '@/services/site/purchases.service';
import { invalidatePurchase } from './keys';

// Changes an open purchase's notes, then refreshes the purchase and its actions
export function useChangePurchaseNotes(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePurchaseNotesPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, ChangePurchaseNotesPayload>({
    ...options,
    mutationFn: changePurchaseNotes,
    onSuccess: (...args) => {
      const [, variables] = args;
      invalidatePurchase(queryClient, variables.id);
      options?.onSuccess?.(...args);
    },
  });
}
