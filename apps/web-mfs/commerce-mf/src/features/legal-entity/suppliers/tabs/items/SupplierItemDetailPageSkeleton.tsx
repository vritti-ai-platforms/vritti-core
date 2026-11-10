import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const SupplierItemDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />
    <TabsSkeleton count={3} tabWidths={['w-20', 'w-16', 'w-16']} />
    <Skeleton className="h-48 w-full" />
  </div>
);
