import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { VariantOption } from '@/schemas/variant-options';
import { createVariantOption } from '@/services/variant-options.service';
import { VARIANT_OPTIONS_KEY } from './keys';

interface CreateVariantOptionVariables {
  catalogId: string;
  data: { name: string; values: string[] };
}

// Creates a variant option on a catalog and invalidates the variant options list
export function useCreateVariantOption(
  options?: Omit<UseMutationOptions<VariantOption, AxiosError, CreateVariantOptionVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<VariantOption, AxiosError, CreateVariantOptionVariables>({
    ...options,
    mutationFn: createVariantOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: VARIANT_OPTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
