import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { SelectOptionsResponse } from '@vritti/quantum-ui/Select';
import type { AxiosError } from 'axios';
import { searchItemVariantsForPriceList } from '@/services/price-lists.service';
import { PRICE_LIST_ITEM_VARIANTS_SELECT_KEY } from './keys';

export function useSearchItemVariantsForPriceList(
  search?: string,
  options?: Omit<UseQueryOptions<SelectOptionsResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SelectOptionsResponse, AxiosError>({
    queryKey: PRICE_LIST_ITEM_VARIANTS_SELECT_KEY(search),
    queryFn: () => searchItemVariantsForPriceList(search),
    ...options,
  });
}
