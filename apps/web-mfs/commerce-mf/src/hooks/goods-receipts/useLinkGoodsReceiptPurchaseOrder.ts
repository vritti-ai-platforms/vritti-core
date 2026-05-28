import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { linkGoodsReceiptPurchaseOrder } from '@/services/goods-receipts.service';
import { GOODS_RECEIPT_KEY, GOODS_RECEIPTS_TABLE_KEY } from './keys';

interface LinkPayload {
  purchaseOrderId: string;
}

export function useLinkGoodsReceiptPurchaseOrder(
  id: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, LinkPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, LinkPayload>({
    ...options,
    mutationFn: ({ purchaseOrderId }) => linkGoodsReceiptPurchaseOrder(id, purchaseOrderId),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(id) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
