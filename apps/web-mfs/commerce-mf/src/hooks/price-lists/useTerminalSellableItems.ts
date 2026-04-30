import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PosTerminalSellableItemData } from '@/schemas/price-lists';
import { getTerminalSellableItems } from '@/services/price-lists.service';
import { POS_TERMINAL_SELLABLE_ITEMS_KEY } from './keys';

// Fetches the variants a terminal can sell across its assigned price lists
export function useTerminalSellableItems(
  terminalId: string | null,
  options?: Omit<UseQueryOptions<PosTerminalSellableItemData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PosTerminalSellableItemData[], AxiosError>({
    queryKey: POS_TERMINAL_SELLABLE_ITEMS_KEY(terminalId ?? ''),
    queryFn: () => getTerminalSellableItems(terminalId as string),
    enabled: !!terminalId,
    ...options,
  });
}
