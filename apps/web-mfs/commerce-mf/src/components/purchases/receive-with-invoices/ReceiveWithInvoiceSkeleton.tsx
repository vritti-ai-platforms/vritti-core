import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const ReceiveWithInvoiceSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <CardSkeleton>
      <div className="grid grid-cols-2 gap-6 px-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardSkeleton>
    <CardSkeleton>
      <div className="px-6">
        <Skeleton className="h-40 w-full" />
      </div>
    </CardSkeleton>
  </div>
);
