import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PriceListItemData } from '@/schemas/price-lists';
import { getPriceListItems } from '@/services/price-lists.service';
import { PRICE_LIST_ITEMS_KEY } from './keys';

export function usePriceListItems(
  priceListId: string,
  options?: Omit<UseQueryOptions<PriceListItemData[], AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PriceListItemData[], AxiosError>({
    queryKey: PRICE_LIST_ITEMS_KEY(priceListId),
    queryFn: () => getPriceListItems(priceListId),
    enabled: !!priceListId,
    ...options,
  });
}
