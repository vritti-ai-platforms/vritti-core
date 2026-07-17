import { useQuery } from '@tanstack/react-query';
import { ORG_TAX_JURISDICTIONS } from '@vritti/commerce-permissions/tax-jurisdictions';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getTaxJurisdictionsTree } from '@/services/organization/tax-jurisdictions.service';
import type { TaxJurisdictionTreeNode } from '@/schemas/tax-jurisdictions';
import { TAX_JURISDICTION_TREE_KEY } from './keys';

export function useTaxJurisdictionTree(search?: string) {
  // The tree endpoint is guarded by tax-jurisdictions.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(ORG_TAX_JURISDICTIONS.view);
  return useQuery<TaxJurisdictionTreeNode[], AxiosError>({
    queryKey: [...TAX_JURISDICTION_TREE_KEY, search ?? ''],
    queryFn: () => getTaxJurisdictionsTree(search),
    enabled: available,
  });
}
