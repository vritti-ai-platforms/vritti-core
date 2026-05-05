import { PageContent, PageContentDetails, PageContentPanel, PanelSkeleton } from '@vritti/quantum-ui/PageContent';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const CategoriesPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showActions />
    <PageContent>
      <PageContentPanel
        header={<Skeleton className="h-9 w-full rounded-md" />}
        headerClassName="shrink-0"
      >
        <PanelSkeleton />
      </PageContentPanel>

      <PageContentDetails className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-8" />
          </div>
          <div className="col-span-2 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-48" />
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
