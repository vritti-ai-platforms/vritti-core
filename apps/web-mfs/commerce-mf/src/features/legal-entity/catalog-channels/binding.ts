import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import type { CatalogChannelsBinding } from '@/components/catalog-channels/bindings';
import {
  CHANNEL_ITEMS_KEY,
  CHANNELS_SCREEN_KEY,
  useChannelItems,
  useChannelsScreen,
  useCreateAppChannel,
  useCreateB2bChannel,
  useCreatePosChannel,
  useDeleteChannel,
  useSetChannelItemVisibility,
  useUpdateChannel,
} from '@/hooks/legal-entity/catalog-channels';

export const leCatalogChannelsBinding: CatalogChannelsBinding = {
  permissions: LE_CATALOG_CHANNELS,
  itemsTableSlug: (channelId) => `commerce-le-channel-${channelId}-items`,
  screenKey: CHANNELS_SCREEN_KEY,
  itemsKey: CHANNEL_ITEMS_KEY,

  useChannelsScreen,
  useChannelItems,

  useCreateAppChannel,
  useCreatePosChannel,
  useCreateB2bChannel,

  useUpdateChannel,
  useDeleteChannel,
  useSetChannelItemVisibility,
};
