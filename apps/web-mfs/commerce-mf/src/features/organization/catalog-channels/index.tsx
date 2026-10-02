import { ORG_CATALOG_CHANNELS } from '@vritti/commerce-permissions/catalog-channels';
import { Empty } from '@vritti/quantum-ui/Empty';
import { PermissionGate, PermissionLockIcon } from '@vritti/quantum-ui/PermissionGate';
import { Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ChannelItemsPage } from '@/components/catalog-channels/ChannelItemsPage';
import { ChannelsPage } from '@/components/catalog-channels/ChannelsPage';
import { ChannelsPageSkeleton } from '@/components/catalog-channels/ChannelsPageSkeleton';
import { orgCatalogChannelsBinding } from './binding';

// The gate sits outside the boundary so a denied user never mounts the page and never fires the
// request — useSuspenseQuery has no `enabled`, so the guard cannot live in the hook.
const gated = (element: React.ReactNode, fallback: React.ReactNode) => (
  <PermissionGate
    permission={ORG_CATALOG_CHANNELS.view}
    fallback={({ reason, title, tip }) => (
      <Empty icon={<PermissionLockIcon reason={reason} />} title={title} description={tip} />
    )}
  >
    <Suspense fallback={fallback}>{element}</Suspense>
  </PermissionGate>
);

const routes: RouteObject[] = [
  { index: true, element: gated(<ChannelsPage binding={orgCatalogChannelsBinding} />, <ChannelsPageSkeleton />) },
  { path: ':slug', element: gated(<ChannelItemsPage binding={orgCatalogChannelsBinding} />, <ChannelsPageSkeleton />) },
];

export default routes;
