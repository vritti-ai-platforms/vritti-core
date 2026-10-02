import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import type { CatalogChannelsBinding } from '@/components/catalog-channels/bindings';
import {
  CHANNEL_ITEMS_KEY,
  useCatalogChannels,
  useChannelItems,
  useDeleteChannel,
  useSetChannelItemVisibility,
  useUpsertChannel,
} from '@/hooks/organization/catalog-channels';

export const orgCatalogChannelsBinding: CatalogChannelsBinding = {
  permissions: ORG_CATALOG_CHANNELS,
  itemsTableSlug: (channelId) => `commerce-org-channel-${channelId}-items`,
  itemsKey: CHANNEL_ITEMS_KEY,

  useCatalogChannels,
  useChannelItems,

  useUpsertChannel,
  useDeleteChannel,
  useSetChannelItemVisibility,
};
