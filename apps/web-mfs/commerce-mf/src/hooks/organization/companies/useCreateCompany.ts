import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CompanyData, CreateCompanyPayload } from '@/schemas/companies';
import { createCompany } from '@/services/organization/companies.service';
import { COMPANIES_TABLE_KEY } from './keys';

export function useCreateCompany(
  options?: Omit<UseMutationOptions<CreateResponse<CompanyData>, AxiosError, CreateCompanyPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<CompanyData>, AxiosError, CreateCompanyPayload>({
    ...options,
    mutationFn: createCompany,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: COMPANIES_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
