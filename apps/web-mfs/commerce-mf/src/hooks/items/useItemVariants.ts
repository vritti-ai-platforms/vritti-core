import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemVariant } from '@/schemas/items';
import { listVariants } from '@/services/items.service';
import { ITEM_VARIANTS_KEY } from './keys';

// Fetches variants for an item
export function useItemVariants(
  itemId: string | null,
  options?: Omit<UseQueryOptions<ItemVariant[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemVariant[], AxiosError>({
    queryKey: ITEM_VARIANTS_KEY(itemId ?? ''),
    queryFn: () => listVariants(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}
