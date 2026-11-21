import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateOfferingFormData } from '@/schemas/offerings';
import { updateOffering } from '@/services/site/offerings.service';

export function useUpdateOffering(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, { id: string; data: UpdateOfferingFormData }>({
    ...options,
    mutationFn: updateOffering,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings]);
      options?.onSuccess?.(...args);
    },
  });
}
