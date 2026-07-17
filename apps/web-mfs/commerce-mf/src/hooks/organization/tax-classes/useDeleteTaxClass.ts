import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxClass } from '@/services/organization/tax-classes.service';
import { TAX_CLASSES_TABLE_KEY } from './keys';

export function useDeleteTaxClass(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxClass,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_CLASSES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
