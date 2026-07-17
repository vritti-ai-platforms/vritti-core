import { useQuery } from '@tanstack/react-query';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getTaxJurisdictionChildrenTable } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionChildrenTableResponse } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTION_CHILDREN_TABLE_KEY } from './keys';

export function useTaxJurisdictionChildrenTable(parentId: string | null) {
  const { available } = usePermission(ORG_TAX_JURISDICTIONS.view);
  return useQuery<TaxJurisdictionChildrenTableResponse, AxiosError>({
    queryKey: TAX_JURISDICTION_CHILDREN_TABLE_KEY(parentId ?? ''),
    queryFn: () => getTaxJurisdictionChildrenTable(parentId as string),
    enabled: available && !!parentId,
  });
}
