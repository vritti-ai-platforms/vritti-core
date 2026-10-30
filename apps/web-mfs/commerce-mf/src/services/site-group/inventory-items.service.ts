import axios from '@vritti/quantum-ui/axios';
import type { SiteGroupInventoryItemsTableResponse } from '@/schemas/inventory-items';

const BASE = 'commerce-api/site-group/inventory-items';

export function getSiteGroupInventoryItemsTable(): Promise<SiteGroupInventoryItemsTableResponse> {
  return axios.get<SiteGroupInventoryItemsTableResponse>(`${BASE}/table`).then((r) => r.data);
}
