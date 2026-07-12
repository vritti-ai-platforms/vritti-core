import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { VariantOption, VariantOptionData } from '@/schemas/variant-options';
import { updateVariantOption } from '@/services/site/variant-options.service';
import { VARIANT_OPTIONS_KEY } from './keys';

interface UpdateVariantOptionVariables {
  catalogId: string;
  optionId: string;
  data: VariantOptionData;
}

// Updates a variant option on a catalog and invalidates the variant options list
export function useUpdateVariantOption(
  options?: Omit<UseMutationOptions<VariantOption, AxiosError, UpdateVariantOptionVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<VariantOption, AxiosError, UpdateVariantOptionVariables>({
    ...options,
    mutationFn: updateVariantOption,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: VARIANT_OPTIONS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
