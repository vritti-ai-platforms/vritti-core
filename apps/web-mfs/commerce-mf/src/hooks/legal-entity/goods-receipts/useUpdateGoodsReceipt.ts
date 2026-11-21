import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { UpdateGoodsReceiptPayload } from '@/schemas/goods-receipts';
import { updateGoodsReceipt } from '@/services/legal-entity/goods-receipts.service';

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
      invalidateWrites(queryClient, [Tables.goodsReceipts]);
      options?.onSuccess?.(...args);
    },
  });
}
