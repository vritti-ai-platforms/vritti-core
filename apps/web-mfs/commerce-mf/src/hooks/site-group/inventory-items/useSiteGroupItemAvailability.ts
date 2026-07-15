import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SiteGroupItemAvailabilityData } from '@/schemas/site-group-inventory-items';
import { getSiteGroupItemAvailability } from '@/services/site-group/inventory-items.service';
import { SITE_GROUP_INVENTORY_ITEMS_AVAILABILITY_KEY } from './keys';

// Fetches per-item availability
export function useSiteGroupItemAvailability(siteIds: string[]) {
  return useQuery<SiteGroupItemAvailabilityData[], AxiosError>({
    queryKey: SITE_GROUP_INVENTORY_ITEMS_AVAILABILITY_KEY(siteIds),
    queryFn: () => getSiteGroupItemAvailability(siteIds),
    enabled: siteIds.length > 0,
  });
}
