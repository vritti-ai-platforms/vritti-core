import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { publishGoodsReceipt } from '@/services/goods-receipts.service';
import { GOODS_RECEIPTS_TABLE_KEY, GOODS_RECEIPT_KEY, GOODS_RECEIPT_TREE_KEY } from './keys';

export function usePublishGoodsReceipt(
  id: string,
  options?: Omit<UseMutationOptions<GoodsReceiptData, AxiosError, void>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<GoodsReceiptData, AxiosError, void>({
    ...options,
    mutationFn: () => publishGoodsReceipt(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(id) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_TREE_KEY(id) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
