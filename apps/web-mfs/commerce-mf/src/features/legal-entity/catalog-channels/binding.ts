import { LE_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import type { CatalogChannelsBinding } from '@/components/catalog-channels/bindings';
import {
  CHANNEL_ITEMS_KEY,
  CHANNEL_PRICES_KEY,
  useCatalogChannels,
  useChannelCurrencies,
  useChannelItems,
  useChannelPrices,
  useDeleteChannel,
  useSetChannelItemVisibility,
  useUpsertChannel,
} from '@/hooks/legal-entity/catalog-channels';

export const leCatalogChannelsBinding: CatalogChannelsBinding = {
  permissions: LE_CATALOG_CHANNELS,
  itemsTableSlug: (channelId) => `commerce-le-channel-${channelId}-items`,
  itemsKey: CHANNEL_ITEMS_KEY,
  pricesTableSlug: (channelId) => `commerce-le-channel-${channelId}-prices`,
  pricesKey: CHANNEL_PRICES_KEY,

  useCatalogChannels,
  useChannelCurrencies,
  useChannelItems,
  useChannelPrices,

  useUpsertChannel,
  useDeleteChannel,
  useSetChannelItemVisibility,
};
