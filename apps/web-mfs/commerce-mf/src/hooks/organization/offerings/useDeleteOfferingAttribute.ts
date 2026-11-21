import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deleteAttribute } from '@/services/organization/offerings.service';

export function useDeleteOfferingAttribute(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteAttribute,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributes, Tables.offeringAttributeValues]);
      options?.onSuccess?.(...args);
    },
  });
}
