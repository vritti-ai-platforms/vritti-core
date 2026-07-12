import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { CatalogChannel } from '@/schemas/catalogs';
import { listCatalogChannels } from '@/site/services/catalogs.service';
import { CATALOG_CHANNELS_KEY } from './keys';

export function useCatalogChannels(catalogId: string) {
  return useQuery<CatalogChannel[], AxiosError>({
    queryKey: CATALOG_CHANNELS_KEY(catalogId),
    queryFn: () => listCatalogChannels(catalogId),
  });
}
