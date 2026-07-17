import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getTaxJurisdiction } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionData } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTIONS_KEY } from './keys';

export function useTaxJurisdictionById(id: string | null) {
  return useQuery<TaxJurisdictionData, AxiosError>({
    queryKey: [...TAX_JURISDICTIONS_KEY, 'detail', id],
    queryFn: () => getTaxJurisdiction(id as string),
    enabled: !!id,
  });
}
