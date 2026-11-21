import type {
  CatalogChannelPermissions,
  UseCatalogChannels,
  UseChannelCounts,
  UseChannelCurrencies,
  UseChannelItems,
  UseChannelPrices,
  UseDeleteChannel,
  UseSetChannelItemVisibility,
  UseUpsertChannel,
} from './types';

export interface CatalogChannelsBinding {
  permissions: CatalogChannelPermissions;
  itemsTableSlug: (channelId: string) => string;
  itemsKey: (channelId: string) => readonly unknown[];
  pricesTableSlug: (channelId: string) => string;
  pricesKey: (channelId: string, currencyCode: string) => readonly unknown[];

  useCatalogChannels: UseCatalogChannels;
  useChannelItems: UseChannelItems;
  useChannelCounts: UseChannelCounts;
  useChannelCurrencies: UseChannelCurrencies;
  useChannelPrices: UseChannelPrices;

  useUpsertChannel: UseUpsertChannel;
  useDeleteChannel: UseDeleteChannel;
  useSetChannelItemVisibility: UseSetChannelItemVisibility;
}
