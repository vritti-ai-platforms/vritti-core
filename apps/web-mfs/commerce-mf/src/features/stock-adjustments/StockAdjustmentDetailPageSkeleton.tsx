import { PageContent, PageContentDetails, PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const StockAdjustmentDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showActions />
    <Skeleton className="h-56 w-full rounded-lg" />
    <PageContent>
      <PageContentPanel className="w-80">
        <div className="p-3 border-b">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="p-3 space-y-2">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </PageContentPanel>
      <PageContentDetails className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full rounded-lg" />
        <Skeleton className="h-52 w-full rounded-lg" />
      </PageContentDetails>
    </PageContent>
  </div>
);
