import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { LE_TAX_GROUPS } from '@vritti/commerce-permissions/tax-groups';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import { getTaxGroupsTable } from '@/le/services/tax-groups.service';
import type { TaxGroupsTableResponse } from '@/schemas/tax-groups';
import { TAX_GROUPS_TABLE_KEY } from './keys';

type UseTaxGroupsTableOptions = Omit<UseQueryOptions<TaxGroupsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches the current page of tax groups for the data table (server-state, BU-scoped via RLS)
export function useTaxGroupsTable(options?: UseTaxGroupsTableOptions) {
  // The table endpoint is guarded by tax-groups.view — self-gate so a locked/denied user never fires the request
  const { available } = usePermission(LE_TAX_GROUPS.view);
  return useQuery<TaxGroupsTableResponse, AxiosError>({
    queryKey: TAX_GROUPS_TABLE_KEY,
    queryFn: getTaxGroupsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
