import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const OfferingDetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />

    <TabsSkeleton count={3} tabWidths={['w-24', 'w-28', 'w-24']} />

    <div className="space-y-3 rounded-lg border border-border p-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);
