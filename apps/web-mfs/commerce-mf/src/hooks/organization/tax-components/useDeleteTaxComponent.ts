import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteTaxComponent } from '@/services/organization/tax-components.service';
import { TAX_COMPONENTS_TABLE_KEY } from './keys';

export function useDeleteTaxComponent(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteTaxComponent,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: TAX_COMPONENTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
