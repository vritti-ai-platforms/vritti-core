import type { RouteObject } from 'react-router-dom';
import { AppChannelDetailPage } from '@/features/organization/catalog-channels/AppChannelDetailPage';
import { AppChannelPage } from '@/features/organization/catalog-channels/AppChannelPage';
import { CatalogChannelsPage } from '@/features/organization/catalog-channels/CatalogChannelsPage';
import type { CatalogChannelsBinding } from '@/features/organization/catalog-channels/types';
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
} from '@/hooks/legal-entity/catalog-channels';

const binding: CatalogChannelsBinding = {
  scopeNoun: 'company',
  scopeSegment: 'le',
  description: 'This company sells these catalogs. Anything left alone follows the organization.',
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
