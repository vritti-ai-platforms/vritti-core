import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { deleteVariant } from '@/services/site/offerings.service';
import { OFFERING_KEY } from './keys';

interface DeleteVariantParams {
  catalogId: string;
  offeringId: string;
  variantId: string;
}

type UseDeleteVariantOptions = Omit<UseMutationOptions<void, AxiosError, DeleteVariantParams>, 'mutationFn'>;

// Deletes a single variant from an offering
export function useDeleteVariant(options?: UseDeleteVariantOptions) {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, DeleteVariantParams>({
    mutationFn: deleteVariant,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: OFFERING_KEY });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
