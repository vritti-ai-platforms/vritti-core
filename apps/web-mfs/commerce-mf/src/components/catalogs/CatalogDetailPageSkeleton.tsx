import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';
import type React from 'react';

export const CatalogDetailPageSkeleton: React.FC = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />

    <TabsSkeleton count={1} tabWidths={['w-24']} />

    <div className="space-y-3 rounded-lg border border-border p-6">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);
