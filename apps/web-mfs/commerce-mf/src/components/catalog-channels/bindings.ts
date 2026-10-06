import type {
  CatalogChannelPermissions,
  UseCatalogChannels,
  UseChannelItems,
  UseDeleteChannel,
  UseSetChannelItemVisibility,
  UseUpsertChannel,
} from './types';

export interface CatalogChannelsBinding {
  permissions: CatalogChannelPermissions;
  // Must byte-match the gateway's getCurrentState key or the user's saved view silently resets
  itemsTableSlug: (channelId: string) => string;
  itemsKey: (channelId: string) => readonly unknown[];

  useCatalogChannels: UseCatalogChannels;
  useChannelItems: UseChannelItems;

  useUpsertChannel: UseUpsertChannel;
  useDeleteChannel: UseDeleteChannel;
  useSetChannelItemVisibility: UseSetChannelItemVisibility;
}
