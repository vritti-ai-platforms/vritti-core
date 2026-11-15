import { keepPreviousData, type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_COST_CATEGORIES } from '@vritti/commerce-permissions/cost-categories';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CostCategoriesTableResponse } from '@/schemas/cost-categories';
import { getCostCategoriesTable } from '@/services/organization/cost-categories.service';
import { COST_CATEGORIES_TABLE_KEY } from './keys';

// Fetches the cost categories table; self-gates on the view permission
export function useCostCategoriesTable(
  options?: Omit<UseQueryOptions<CostCategoriesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_COST_CATEGORIES.view);
  return useQuery<CostCategoriesTableResponse, AxiosError>({
    queryKey: COST_CATEGORIES_TABLE_KEY,
    queryFn: getCostCategoriesTable,
    placeholderData: keepPreviousData,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}
