import type {
  CatalogChannelPermissions,
  UseCatalogChannels,
  UseChannelCurrencies,
  UseChannelItems,
  UseChannelPrices,
  UseDeleteChannel,
  UseSetChannelItemVisibility,
  UseUpsertChannel,
} from './types';

export interface CatalogChannelsBinding {
  permissions: CatalogChannelPermissions;
  // Must byte-match the gateway's getCurrentState key or the user's saved view silently resets
  itemsTableSlug: (channelId: string) => string;
  itemsKey: (channelId: string) => readonly unknown[];
  // The Prices drill-in shares one saved view across currencies — the columns never differ
  pricesTableSlug: (channelId: string) => string;
  pricesKey: (channelId: string, currencyCode: string) => readonly unknown[];

  useCatalogChannels: UseCatalogChannels;
  useChannelItems: UseChannelItems;
  useChannelCurrencies: UseChannelCurrencies;
  useChannelPrices: UseChannelPrices;

  useUpsertChannel: UseUpsertChannel;
  useDeleteChannel: UseDeleteChannel;
  useSetChannelItemVisibility: UseSetChannelItemVisibility;
}
