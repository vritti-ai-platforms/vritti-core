import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { updateVariant } from '@/services/legal-entity/offerings.service';

export function useUpdateOfferingVariant(
  options?: Omit<
    UseMutationOptions<
      SuccessResponse,
      AxiosError,
      { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<
    SuccessResponse,
    AxiosError,
    { id: string; data: { name?: string; externalSku?: string | null; isActive?: boolean } }
  >({
    ...options,
    mutationFn: updateVariant,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
