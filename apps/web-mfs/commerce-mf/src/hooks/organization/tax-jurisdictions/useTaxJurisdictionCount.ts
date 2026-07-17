import { useQuery } from '@tanstack/react-query';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getTaxJurisdictionCount } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionCountData } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTION_COUNT_KEY } from './keys';

export function useTaxJurisdictionCount() {
  const { available } = usePermission(ORG_TAX_JURISDICTIONS.view);
  return useQuery<TaxJurisdictionCountData, AxiosError>({
    queryKey: TAX_JURISDICTION_COUNT_KEY,
    queryFn: () => getTaxJurisdictionCount(),
    enabled: available,
  });
}
