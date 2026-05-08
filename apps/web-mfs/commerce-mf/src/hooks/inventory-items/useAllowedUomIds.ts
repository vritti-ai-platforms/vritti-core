import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { getAllowedUomIds } from '@/services/inventory-items.service';
import { INVENTORY_ITEM_ALLOWED_UOM_IDS_KEY } from './keys';

export function useAllowedUomIds(itemId: string | null | undefined) {
  return useQuery<string[], AxiosError>({
    queryKey: INVENTORY_ITEM_ALLOWED_UOM_IDS_KEY(itemId ?? ''),
    queryFn: () => getAllowedUomIds(itemId as string),
    enabled: !!itemId,
  });
}
