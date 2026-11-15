import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const PurchaseActivityTimelineSkeleton = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="h-4 w-28" />
    <CardSkeleton>
      <div className="flex flex-col gap-4 px-6">
        {['first', 'second', 'third', 'fourth'].map((row) => (
          <div key={row} className="flex gap-3">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </CardSkeleton>
  </div>
);

export const PurchaseActivitySkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <div className="flex flex-wrap items-center gap-2">
      {['all', 'stage', 'items', 'quotations', 'sourcing', 'procuring', 'invoices'].map((chip) => (
        <Skeleton key={chip} className="h-8 w-20" />
      ))}
      <Skeleton className="ml-auto h-9 w-64" />
    </div>
    <PurchaseActivityTimelineSkeleton />
  </div>
);
