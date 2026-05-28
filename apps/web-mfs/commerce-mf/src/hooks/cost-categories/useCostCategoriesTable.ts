import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CostCategoriesTableResponse } from '@/schemas/cost-categories';
import { getCostCategoriesTable } from '@/services/cost-categories.service';
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
