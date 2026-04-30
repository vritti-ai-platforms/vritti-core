import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TerminalPriceListData } from '@/schemas/price-lists';
import { getTerminalPriceLists } from '@/services/price-lists.service';
import { TERMINAL_PRICE_LISTS_KEY } from './keys';

export function useTerminalPriceLists(
  terminalId: string,
  options?: Omit<UseQueryOptions<TerminalPriceListData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<TerminalPriceListData[], AxiosError>({
    queryKey: TERMINAL_PRICE_LISTS_KEY(terminalId),
    queryFn: () => getTerminalPriceLists(terminalId),
    enabled: !!terminalId,
    ...options,
  });
}
