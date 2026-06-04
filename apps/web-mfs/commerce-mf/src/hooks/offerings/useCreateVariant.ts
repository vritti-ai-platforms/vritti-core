import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CreateVariantData, OfferingVariant } from '@/schemas/offerings';
import { createVariant } from '@/services/offerings.service';
import { OFFERING_KEY } from './keys';

type CreateVariantVariables = { catalogId: string; offeringId: string; data: CreateVariantData };

// Creates a single variant and invalidates offering detail
export function useCreateVariant(
  options?: Omit<UseMutationOptions<OfferingVariant, AxiosError, CreateVariantVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<OfferingVariant, AxiosError, CreateVariantVariables>({
    ...options,
    mutationFn: createVariant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERING_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
