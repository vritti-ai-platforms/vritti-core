import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OfferingVariant, UpdateVariantData } from '@/schemas/offerings';
import { updateVariant } from '@/services/site/offerings.service';
import { OFFERING_KEY } from './keys';

type UpdateVariantVariables = { catalogId: string; offeringId: string; variantId: string; data: UpdateVariantData };

// Updates a single variant and invalidates offering detail
export function useUpdateVariant(
  options?: Omit<UseMutationOptions<OfferingVariant, AxiosError, UpdateVariantVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OfferingVariant, AxiosError, UpdateVariantVariables>({
    ...options,
    mutationFn: updateVariant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERING_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
