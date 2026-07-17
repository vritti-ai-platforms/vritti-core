import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CompanyData } from '@/schemas/companies';
import { getCompany } from '@/services/organization/companies.service';
import { COMPANY_KEY } from './keys';

// Fetches ORG company detail by ID; suspends until data is available
export function useCompanyById(id: string) {
  return useSuspenseQuery<CompanyData, AxiosError>({
    queryKey: COMPANY_KEY(id),
    queryFn: () => getCompany(id),
  });
}
