import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemDetail } from '@/schemas/items';
import { getItem } from '@/services/items.service';

export const ITEM_DETAIL_QUERY_KEY = ['item'] as const;

// Fetches full item detail by ID
export function useItem(
  id: string | null,
  options?: Omit<UseQueryOptions<ItemDetail, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemDetail, AxiosError>({
    queryKey: ['item', id],
    queryFn: () => getItem(id as string),
    enabled: !!id,
    ...options,
  });
}
