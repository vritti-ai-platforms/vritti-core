import { useQuery } from '@tanstack/react-query';
import { ORG_CATALOGS } from '@vritti/commerce-permissions/catalogs';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { CatalogChannelData } from '@/schemas/catalog-channels';
import { getCatalogChannelsForCatalog } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_FOR_CATALOG_KEY } from './keys';

export function useCatalogChannelsForCatalog(catalogId: string) {
  const { available } = usePermission(ORG_CATALOGS.view);
  return useQuery<CatalogChannelData[], AxiosError>({
    queryKey: CATALOG_CHANNELS_FOR_CATALOG_KEY(catalogId),
    queryFn: () => getCatalogChannelsForCatalog(catalogId),
    enabled: available,
  });
}
