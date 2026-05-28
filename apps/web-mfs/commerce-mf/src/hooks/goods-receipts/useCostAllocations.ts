import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CostAllocationData } from '@/schemas/inventory-item-costs';
import { getCostAllocations } from '@/services/goods-receipt-costs.service';
import { GOODS_RECEIPT_COST_ALLOCATIONS_KEY } from './keys';

export function useCostAllocations(
  grId: string,
  costId: string,
  options?: Omit<UseQueryOptions<CostAllocationData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<CostAllocationData[], AxiosError>({
    queryKey: [...GOODS_RECEIPT_COST_ALLOCATIONS_KEY(grId, costId)],
    queryFn: () => getCostAllocations(grId, costId),
    enabled: !!grId && !!costId,
    ...options,
  });
}
