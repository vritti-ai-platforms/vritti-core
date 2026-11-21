import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateAttributeData, OfferingAttributeData } from '@/schemas/offerings';
import { createAttribute } from '@/services/organization/offerings.service';

export function useCreateOfferingAttribute(
  options?: Omit<
    UseMutationOptions<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeData>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingAttributeData>, AxiosError, CreateAttributeData>({
    ...options,
    mutationFn: createAttribute,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offeringAttributes]);
      options?.onSuccess?.(...args);
    },
  });
}
