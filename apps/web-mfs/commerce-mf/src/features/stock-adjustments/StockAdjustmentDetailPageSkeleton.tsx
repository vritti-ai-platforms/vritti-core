import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const StockAdjustmentDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showActions />
    <Skeleton className="h-56 w-full rounded-lg" />
    <PageContent>
      <div className="w-80 border-r shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-3 space-y-2">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6 min-w-0 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-52 w-full rounded-lg" />
      </div>
    </PageContent>
  </div>
);
