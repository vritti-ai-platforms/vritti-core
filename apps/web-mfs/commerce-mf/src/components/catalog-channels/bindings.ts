import type {
  CatalogChannelPermissions,
  UseCatalogChannels,
  UseChannelItems,
  UseDeleteChannel,
  UseSetChannelItemVisibility,
  UseUpsertChannel,
} from './types';

/**
 * One set of components serves Organization, Company and Outlet.
 *
 * The binding carries permissions, scoped hooks and the table slug — and deliberately no copy. A
 * label naming a scope ("Override for this company") would force the shared component to know which
 * workspace it is rendering; level names shown in the UI come from the row instead.
 */
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
