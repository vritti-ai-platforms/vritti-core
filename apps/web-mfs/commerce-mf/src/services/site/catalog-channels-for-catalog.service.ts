import axios from '@vritti/quantum-ui/axios';
import type { CatalogChannelData } from '@/schemas/catalog-channels';

export function getCatalogChannelsForCatalog(catalogId: string): Promise<CatalogChannelData[]> {
  return axios
    .get<CatalogChannelData[]>(`commerce-api/site/catalogs/${catalogId}/channels`, { showSuccessToast: false })
    .then((r) => r.data);
}
