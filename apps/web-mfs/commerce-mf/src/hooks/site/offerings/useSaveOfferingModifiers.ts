import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingModifierGroup } from '@/schemas/offerings';
import { saveOfferingModifiers } from '@/services/site/offerings.service';
import { OFFERING_KEY } from './keys';

type SaveModifiersVariables = { catalogId: string; offeringId: string; groupIds: string[] };

// Saves modifier group assignments for an offering
export function useSaveOfferingModifiers(
  options?: Omit<UseMutationOptions<OfferingModifierGroup[], AxiosError, SaveModifiersVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OfferingModifierGroup[], AxiosError, SaveModifiersVariables>({
    ...options,
    mutationFn: saveOfferingModifiers,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERING_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
