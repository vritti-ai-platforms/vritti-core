import { SITE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
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
} from '@/hooks/site/catalog-channels';

export const siteCatalogChannelsBinding: CatalogChannelsBinding = {
  permissions: SITE_CATALOG_CHANNELS,
  itemsTableSlug: (channelId) => `commerce-site-channel-${channelId}-items`,
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
