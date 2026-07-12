import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockAdjustmentTreeNode } from '@/schemas/stock-adjustments';
import { getStockAdjustmentTree } from '@/services/site/stock-adjustments.service';
import { STOCK_ADJUSTMENT_TREE_KEY } from './keys';

export function useStockAdjustmentTree(
  adjustmentId: string | null,
  options?: Omit<UseQueryOptions<StockAdjustmentTreeNode[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockAdjustmentTreeNode[], AxiosError>({
    queryKey: STOCK_ADJUSTMENT_TREE_KEY(adjustmentId ?? ''),
    queryFn: () => getStockAdjustmentTree(adjustmentId as string),
    enabled: !!adjustmentId,
    ...options,
  });
}
