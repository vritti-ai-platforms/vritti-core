import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_TAX_COMPONENTS } from '@vritti/commerce-permissions/tax-components';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { TaxComponentsTableResponse } from '@/schemas/tax-components';
import { getTaxComponentsTable } from '@/services/organization/tax-components.service';
import { TAX_COMPONENTS_TABLE_KEY } from './keys';

export function useTaxComponentsTable(
  options?: Omit<UseQueryOptions<TaxComponentsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_TAX_COMPONENTS.view);
  return useQuery<TaxComponentsTableResponse, AxiosError>({
    queryKey: [...TAX_COMPONENTS_TABLE_KEY],
    queryFn: getTaxComponentsTable,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
