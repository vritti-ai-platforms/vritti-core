import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemDetail } from '@/schemas/items';
import { getItem } from '@/services/items.service';
import { ITEM_DETAIL_KEY } from './keys';

// Fetches full item detail by ID
export function useItem(
  id: string | null,
  options?: Omit<UseQueryOptions<ItemDetail, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemDetail, AxiosError>({
    queryKey: ITEM_DETAIL_KEY(id ?? ''),
    queryFn: () => getItem(id as string),
    enabled: !!id,
    ...options,
  });
}
