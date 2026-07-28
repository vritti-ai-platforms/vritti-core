import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const RepositoryDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />

    <TabsSkeleton count={2} tabWidths={['w-24', 'w-16']} />

    <Skeleton className="h-72 w-full" />
  </div>
);
