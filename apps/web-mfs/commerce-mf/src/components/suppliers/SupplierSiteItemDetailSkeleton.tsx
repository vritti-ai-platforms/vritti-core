import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const SupplierSiteItemDetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <TabsSkeleton count={2} tabWidths={['w-20', 'w-16']} />
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-80 w-full" />
  </div>
);
