import { PageContent, PageContentDetails, PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const StorageLocationsPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showActions />
    <PageContent>
      <PageContentPanel>
        <div className="p-3 border-b shrink-0 flex flex-col gap-2">
          <Skeleton className="h-9 w-full rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-7 flex-1 rounded-md" />
            <Skeleton className="h-7 flex-1 rounded-md" />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-11/12 rounded-md" />
          <Skeleton className="h-8 w-10/12 rounded-md" />
          <Skeleton className="h-8 w-9/12 rounded-md" />
        </div>
      </PageContentPanel>

      <PageContentDetails className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </PageContentDetails>
    </PageContent>
  </div>
);
