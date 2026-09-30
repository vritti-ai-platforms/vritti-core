import type {
  CatalogChannelPermissions,
  UseChannelItems,
  UseChannelsScreen,
  UseCreateAppChannel,
  UseCreateB2bChannel,
  UseCreatePosChannel,
  UseDeleteChannel,
  UseSetChannelItemVisibility,
  UseUpdateChannel,
} from './types';

/**
 * One set of components serves Organization, Company and Outlet.
 *
 * The binding carries permissions, scoped hooks and the table slug — and deliberately no copy. A
 * label naming a scope ("Override for this company") would force the shared component to know which
 * workspace it is rendering; level names shown on screen come from the row instead.
 */
export interface CatalogChannelsBinding {
  permissions: CatalogChannelPermissions;
  // Must byte-match the gateway's getCurrentState key or the user's saved view silently resets
  itemsTableSlug: (channelId: string) => string;
  screenKey: readonly unknown[];
  itemsKey: (channelId: string) => readonly unknown[];

  useChannelsScreen: UseChannelsScreen;
  useChannelItems: UseChannelItems;

  useCreateAppChannel: UseCreateAppChannel;
  useCreatePosChannel: UseCreatePosChannel;
  useCreateB2bChannel: UseCreateB2bChannel;

  useUpdateChannel: UseUpdateChannel;
  useDeleteChannel: UseDeleteChannel;
  useSetChannelItemVisibility: UseSetChannelItemVisibility;
}
