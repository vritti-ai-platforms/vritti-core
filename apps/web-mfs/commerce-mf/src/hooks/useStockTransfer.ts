import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StockTransferData } from '@/schemas/stock-transfers';
import { getStockTransfer } from '@/services/stock-transfers.service';

export function useStockTransfer(
  id: string | null,
  options?: Omit<UseQueryOptions<StockTransferData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<StockTransferData, AxiosError>({
    queryKey: ['commerce', 'stock-transfers', id],
    queryFn: () => getStockTransfer(id as string),
    enabled: !!id,
    ...options,
  });
}
