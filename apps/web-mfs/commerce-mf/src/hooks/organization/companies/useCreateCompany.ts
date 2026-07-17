import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CompanyData, CreateCompanyFormData } from '@/schemas/companies';
import { createCompany } from '@/services/organization/companies.service';
import { COMPANIES_TABLE_KEY } from './keys';

export function useCreateCompany(
  options?: Omit<UseMutationOptions<CreateResponse<CompanyData>, AxiosError, CreateCompanyFormData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<CompanyData>, AxiosError, CreateCompanyFormData>({
    ...options,
    mutationFn: createCompany,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
