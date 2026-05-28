import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CostRowData } from '@/schemas/inventory-item-costs';
import { type AssociateCostPayload, associateGoodsReceiptCost } from '@/services/goods-receipt-costs.service';
import { GOODS_RECEIPT_COSTS_KEY, GOODS_RECEIPT_KEY } from './keys';

export function useAssociateGoodsReceiptCost(
  grId: string,
  options?: Omit<UseMutationOptions<CostRowData, AxiosError, AssociateCostPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<CostRowData, AxiosError, AssociateCostPayload>({
    ...options,
    mutationFn: (data) => associateGoodsReceiptCost({ grId, data }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_COSTS_KEY(grId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(grId) });
      options?.onSuccess?.(...args);
    },
  });
}
