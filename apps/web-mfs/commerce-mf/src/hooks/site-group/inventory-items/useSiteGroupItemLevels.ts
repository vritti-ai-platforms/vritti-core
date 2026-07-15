import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SiteGroupItemLevelsData } from '@/schemas/site-group-inventory-items';
import { getSiteGroupItemLevels } from '@/services/site-group/inventory-items.service';
import { SITE_GROUP_INVENTORY_ITEMS_LEVELS_KEY } from './keys';

// Fetches per (item, site) stock levels
export function useSiteGroupItemLevels(siteIds: string[]) {
  return useQuery<SiteGroupItemLevelsData[], AxiosError>({
    queryKey: SITE_GROUP_INVENTORY_ITEMS_LEVELS_KEY(siteIds),
    queryFn: () => getSiteGroupItemLevels(siteIds),
    enabled: siteIds.length > 0,
  });
}
