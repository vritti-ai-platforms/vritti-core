import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import type { RouteObject } from 'react-router-dom';
import { ChannelItemsPage } from '@/components/catalog-channels/ChannelItemsPage';
import { ChannelsPage } from '@/components/catalog-channels/ChannelsPage';
import { orgCatalogChannelsBinding } from './binding';

const gated = (element: React.ReactNode) => (
  <PermissionGate
    permission={ORG_CATALOG_CHANNELS.view}
    fallback={({ reason, title, tip }) => (
      <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
    )}
  >
    {element}
  </PermissionGate>
);

const routes: RouteObject[] = [
  { index: true, element: <ChannelsPage binding={orgCatalogChannelsBinding} /> },
  { path: ':slug', element: gated(<ChannelItemsPage binding={orgCatalogChannelsBinding} />) },
];

export default routes;
