import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CompanyCounts } from '@/schemas/companies';
import { getCompanyCounts } from '@/services/organization/companies.service';
import { COMPANY_COUNTS_KEY } from './keys';

// Fetches how many rows each tab of a company lists; under the company's key, so whatever refreshes the company
// refreshes them
export function useCompanyCounts(id: string) {
  return useQuery<CompanyCounts, AxiosError>({
    queryKey: COMPANY_COUNTS_KEY(id),
    queryFn: () => getCompanyCounts(id),
  });
}
