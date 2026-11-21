import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { CreateOfferingData, OfferingData } from '@/schemas/offerings';
import { createOffering } from '@/services/legal-entity/offerings.service';

export function useCreateOffering(
  options?: Omit<UseMutationOptions<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CreateResponse<OfferingData>, AxiosError, CreateOfferingData>({
    ...options,
    mutationFn: createOffering,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.offerings]);
      options?.onSuccess?.(...args);
    },
  });
}
