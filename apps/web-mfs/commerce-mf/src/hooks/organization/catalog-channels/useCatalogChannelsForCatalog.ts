import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogChannelData } from '@/schemas/catalog-channels';
import { getCatalogChannelsForCatalog } from '@/services/organization/catalog-channels-for-catalog.service';

export const CATALOG_CHANNELS_FOR_CATALOG_KEY = (catalogId: string) =>
  ['commerce', 'org', 'catalogs', catalogId, 'channels'] as const;

export function useCatalogChannelsForCatalog(catalogId: string) {
  return useQuery<CatalogChannelData[], AxiosError>({
    queryKey: CATALOG_CHANNELS_FOR_CATALOG_KEY(catalogId),
    queryFn: () => getCatalogChannelsForCatalog(catalogId),
    enabled: Boolean(catalogId),
  });
}
