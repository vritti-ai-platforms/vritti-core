import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ItemModifierGroup } from '@/schemas/items';
import { listItemModifiers } from '@/services/items.service';
import { ITEM_MODIFIERS_KEY } from './keys';

// Fetches assigned modifier groups for an item
export function useItemModifiers(
  itemId: string | null,
  options?: Omit<UseQueryOptions<ItemModifierGroup[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ItemModifierGroup[], AxiosError>({
    queryKey: ITEM_MODIFIERS_KEY(itemId ?? ''),
    queryFn: () => listItemModifiers(itemId as string),
    enabled: !!itemId,
    ...options,
  });
}
