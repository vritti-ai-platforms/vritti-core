import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteGoodsReceiptCost } from '@/services/goods-receipt-costs.service';
import { GOODS_RECEIPT_COSTS_KEY, GOODS_RECEIPT_KEY } from './keys';

export function useDeleteGoodsReceiptCost(
  grId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: (costId) => deleteGoodsReceiptCost({ grId, costId }),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_COSTS_KEY(grId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(grId) });
      options?.onSuccess?.(...args);
    },
  });
}
