import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { addSuggestedComponent } from '@/services/site/offerings.service';

export function useAddOfferingVariantSuggestedComponent(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: addSuggestedComponent,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringBom, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
