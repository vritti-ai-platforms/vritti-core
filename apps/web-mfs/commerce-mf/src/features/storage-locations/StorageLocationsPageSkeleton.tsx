import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const StorageLocationsPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <CardSkeleton count={6} className="p-4">
        <div className="flex flex-col gap-2 px-0">
          <Skeleton className="h-5 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardSkeleton>
    </div>
  </div>
);
