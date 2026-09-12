import type { RouteObject } from 'react-router-dom';
import {
  APP_CHANNEL_ITEMS_KEY,
  APP_CHANNEL_KEY,
  useAppChannelItems,
  useAppChannels,
  useCatalogChannelsOverview,
  useCreateAppChannel,
  useDeleteAppChannel,
  useSetAppChannelItemVisibility,
  useUpdateAppChannel,
} from '@/hooks/organization/catalog-channels';
import { AppChannelDetailPage } from './AppChannelDetailPage';
import { AppChannelPage } from './AppChannelPage';
import { CatalogChannelsPage } from './CatalogChannelsPage';
import type { CatalogChannelsBinding } from './types';

const binding: CatalogChannelsBinding = {
  scopeNoun: 'organization',
  scopeSegment: 'org',
  description: 'The catalog each way of selling uses. Companies and outlets inherit these unless they override them.',
  useOverview: useCatalogChannelsOverview,
  useAppChannels: useAppChannels,
  useAppItems: useAppChannelItems,
  useSetItemVisibility: useSetAppChannelItemVisibility,
  useCreateAppChannel: useCreateAppChannel,
  useUpdateAppChannel: useUpdateAppChannel,
  useDeleteAppChannel: useDeleteAppChannel,
  appChannelsKey: APP_CHANNEL_KEY,
  appItemsKey: APP_CHANNEL_ITEMS_KEY,
};

const routes: RouteObject[] = [
  { index: true, element: <CatalogChannelsPage binding={binding} /> },
  { path: 'app', element: <AppChannelPage binding={binding} /> },
  { path: 'app/:slug', element: <AppChannelDetailPage binding={binding} /> },
];

export default routes;
