import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import type { CatalogChannelsBinding } from '@/components/catalog-channels/bindings';
import {
  CHANNEL_ITEMS_KEY,
  useCatalogChannels,
  useChannelItems,
  useDeleteChannel,
  useSetChannelItemVisibility,
  useUpsertChannel,
} from '@/hooks/site/catalog-channels';

export const siteCatalogChannelsBinding: CatalogChannelsBinding = {
  permissions: SITE_CATALOG_CHANNELS,
  itemsTableSlug: (channelId) => `commerce-site-channel-${channelId}-items`,
  itemsKey: CHANNEL_ITEMS_KEY,

  useCatalogChannels,
  useChannelItems,

  useUpsertChannel,
  useDeleteChannel,
  useSetChannelItemVisibility,
};
