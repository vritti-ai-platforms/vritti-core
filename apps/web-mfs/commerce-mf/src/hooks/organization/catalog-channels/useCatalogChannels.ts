import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ChannelEntryData } from '@/schemas/catalog-channels';
import { getCatalogChannels } from '@/services/organization/catalog-channels.service';
import { CATALOG_CHANNELS_KEY } from './keys';

// Suspends until the screen is ready. useSuspenseQuery has no `enabled`, so the permission gate sits
// outside the Suspense boundary at the route — a denied user never mounts the page and never fetches.
export function useCatalogChannels() {
  return useSuspenseQuery<ChannelEntryData[], AxiosError>({
    queryKey: CATALOG_CHANNELS_KEY,
    queryFn: getCatalogChannels,
  });
}
