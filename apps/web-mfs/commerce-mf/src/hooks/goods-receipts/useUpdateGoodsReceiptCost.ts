import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CostRowData } from '@/schemas/inventory-item-costs';
import { type UpdateCostPayload, updateGoodsReceiptCost } from '@/services/goods-receipt-costs.service';
import { GOODS_RECEIPT_COSTS_KEY, GOODS_RECEIPT_COST_ALLOCATIONS_KEY, GOODS_RECEIPT_KEY } from './keys';

interface Vars {
  costId: string;
  data: UpdateCostPayload;
}

export function useUpdateGoodsReceiptCost(
  grId: string,
  options?: Omit<UseMutationOptions<CostRowData, AxiosError, Vars>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CostRowData, AxiosError, Vars>({
    ...options,
    mutationFn: ({ costId, data }) => updateGoodsReceiptCost({ grId, costId, data }),
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_COSTS_KEY(grId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_COST_ALLOCATIONS_KEY(grId, vars.costId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(grId) });
      options?.onSuccess?.(...args);
    },
  });
}
