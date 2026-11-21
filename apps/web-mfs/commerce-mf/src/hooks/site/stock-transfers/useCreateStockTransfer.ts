import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import type { StockTransferData } from '@/schemas/stock-transfers';
import { type CreateStockTransferPayload, createStockTransfer } from '@/services/site/stock-transfers.service';

export function useCreateStockTransfer(
  options?: Omit<UseMutationOptions<StockTransferData, AxiosError, CreateStockTransferPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<StockTransferData, AxiosError, CreateStockTransferPayload>({
    ...options,
    mutationFn: createStockTransfer,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [Tables.stockTransfers]);
      options?.onSuccess?.(...args);
    },
  });
}
