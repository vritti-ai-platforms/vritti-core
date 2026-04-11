import { PageContent } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const UomPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton />
    <PageContent>
      {/* Left panel skeleton */}
      <div className="w-72 border-r flex flex-col shrink-0 overflow-hidden">
        <div className="p-3 border-b">
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="p-2 space-y-1">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
      {/* Right panel skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-32" />
        </div>
        <Skeleton className="h-6 w-40" />
        <div className="space-y-1">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </PageContent>
  </div>
);
