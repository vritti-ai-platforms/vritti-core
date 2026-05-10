import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const StockAdjustmentDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />

    <TabsSkeleton count={2} />

    <div className="rounded-lg border p-6">
      <Skeleton className="h-6 w-24" />
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-56" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  </div>
);
