import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getTaxJurisdictionChildrenTable } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionChildrenTableResponse } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTION_CHILDREN_TABLE_KEY } from './keys';

export function useTaxJurisdictionChildrenTable(parentId: string | null) {
  return useQuery<TaxJurisdictionChildrenTableResponse, AxiosError>({
    queryKey: TAX_JURISDICTION_CHILDREN_TABLE_KEY(parentId ?? ''),
    queryFn: () => getTaxJurisdictionChildrenTable(parentId as string),
    enabled: !!parentId,
  });
}
