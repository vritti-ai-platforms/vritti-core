import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteCompany } from '@/services/organization/companies.service';
import { COMPANIES_TABLE_KEY } from './keys';

export function useDeleteCompany(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteCompany,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
