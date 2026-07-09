import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteVariantOption } from '@/services/variant-options.service';
import { VARIANT_OPTIONS_KEY } from './keys';

interface DeleteVariantOptionVariables {
  catalogId: string;
  optionId: string;
}

// Deletes a variant option from a catalog and invalidates the variant options list
export function useDeleteVariantOption(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteVariantOptionVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteVariantOptionVariables>({
    ...options,
    mutationFn: deleteVariantOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: VARIANT_OPTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
