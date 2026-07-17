import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateCompanyFormData } from '@/schemas/companies';
import { updateCompany } from '@/services/organization/companies.service';
import { COMPANIES_TABLE_KEY, COMPANY_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateCompanyFormData;
}

export function useUpdateCompany(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateCompany,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: COMPANIES_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: COMPANY_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}
