import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingData } from '@/schemas/offerings';
import { type UpdateOfferingPayload, updateOffering } from '@/services/site/offerings.service';
import { OFFERING_DETAIL_KEY, OFFERINGS_TABLE_KEY } from './keys';

type UpdateOfferingVariables = { catalogId: string; offeringId: string; data: UpdateOfferingPayload };

// Updates offering basic info and invalidates related queries
export function useUpdateOffering(
  options?: Omit<UseMutationOptions<OfferingData, AxiosError, UpdateOfferingVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OfferingData, AxiosError, UpdateOfferingVariables>({
    ...options,
    mutationFn: updateOffering,
    onSuccess: (...args) => {
      const variables = args[1];
      queryClient.invalidateQueries({ queryKey: OFFERINGS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: OFFERING_DETAIL_KEY(variables.catalogId, variables.offeringId) });
      options?.onSuccess?.(...args);
    },
  });
}
