import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { INBOUND_DELIVERIES_KEY } from '@/hooks/site/inbound-deliveries/keys';
import type { UpdateGoodsReceiptPayload } from '@/schemas/goods-receipts';
import { updateGoodsReceipt } from '@/services/site/goods-receipts.service';
import { GOODS_RECEIPT_KEY, GOODS_RECEIPTS_TABLE_KEY } from './keys';

// Changes a draft receipt's notes and the supplier's delivery note; the receipt, the receipts table and the deliveries refresh
export function useUpdateGoodsReceipt(
  goodsReceiptId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateGoodsReceiptPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, UpdateGoodsReceiptPayload>({
    ...options,
    mutationFn: (data) => updateGoodsReceipt(goodsReceiptId, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPT_KEY(goodsReceiptId) });
      queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: INBOUND_DELIVERIES_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
