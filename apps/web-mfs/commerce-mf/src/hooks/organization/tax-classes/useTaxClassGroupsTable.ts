import { useQuery } from '@tanstack/react-query';
import { ORG_TAX_CLASSES } from '@vritti/commerce-permissions/tax-classes';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { TaxClassGroupsTableResponse } from '@/schemas/tax-groups';
import { getTaxClassGroupsTable } from '@/services/organization/tax-classes.service';
import { TAX_CLASS_GROUPS_TABLE_KEY } from './keys';

// Fetches the tax groups a tax class is mapped to; self-gates on the group mapping view permission
export function useTaxClassGroupsTable(taxClassId: string) {
  const { available } = usePermission(ORG_TAX_CLASSES.groups.view);
  return useQuery<TaxClassGroupsTableResponse, AxiosError>({
    queryKey: TAX_CLASS_GROUPS_TABLE_KEY(taxClassId),
    queryFn: () => getTaxClassGroupsTable(taxClassId),
    enabled: available,
  });
}
