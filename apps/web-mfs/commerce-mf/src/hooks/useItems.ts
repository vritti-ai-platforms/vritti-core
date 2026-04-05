import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemData } from '@/schemas/items';
import { listItems } from '@/services/items.service';

export const ITEMS_QUERY_KEY = ['items'] as const;

// Fetches items list for a business unit
export function useItems(
  buId: string | null,
  options?: Omit<UseQueryOptions<ItemData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemData[], AxiosError>({
    queryKey: ['items', buId],
    queryFn: () => listItems(buId as string),
    enabled: !!buId,
    ...options,
  });
}
