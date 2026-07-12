import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getCostCategoriesTable } from '@/services/legal-entity/cost-categories.service';
import type { CostCategoriesTableResponse } from '@/schemas/cost-categories';
import { COST_CATEGORIES_TABLE_KEY } from './keys';

export function useCostCategoriesTable(
  options?: Omit<UseQueryOptions<CostCategoriesTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CostCategoriesTableResponse, AxiosError>({
    queryKey: [...COST_CATEGORIES_TABLE_KEY],
    queryFn: getCostCategoriesTable,
    ...options,
  });
}
