import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateAttributeData } from '@/schemas/offerings';
import { updateAttribute } from '@/services/legal-entity/offerings.service';

export function useUpdateOfferingAttribute(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateAttributeData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateAttributeData>({
    ...options,
    mutationFn: updateAttribute,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributes, Tables.offeringVariants]);
      options?.onSuccess?.(...args);
    },
  });
}
