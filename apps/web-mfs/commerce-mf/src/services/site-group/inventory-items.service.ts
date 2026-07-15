import axios from '@vritti/quantum-ui/axios';
import type {
  SiteGroupInventoryItemData,
  SiteGroupItemAvailabilityData,
  SiteGroupItemLevelsData,
} from '@/schemas/site-group-inventory-items';

export function getSiteGroupInventoryItemsMatrix(siteIds: string[]): Promise<SiteGroupInventoryItemData[]> {
  return axios
    .get<SiteGroupInventoryItemData[]>('commerce-api/site-group/inventory-items/table', {
      params: { siteIds: siteIds.join(',') },
    })
    .then((r) => r.data);
}

export function getSiteGroupItemAvailability(siteIds: string[]): Promise<SiteGroupItemAvailabilityData[]> {
  return axios
    .get<SiteGroupItemAvailabilityData[]>('commerce-api/site-group/inventory-items/availability', {
      params: { siteIds: siteIds.join(',') },
    })
    .then((r) => r.data);
}

export function getSiteGroupItemLevels(siteIds: string[]): Promise<SiteGroupItemLevelsData[]> {
  return axios
    .get<SiteGroupItemLevelsData[]>('commerce-api/site-group/inventory-items/levels', {
      params: { siteIds: siteIds.join(',') },
    })
    .then((r) => r.data);
}
