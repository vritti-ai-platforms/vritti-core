import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const CustomerDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />

    <div className="space-y-3">
      <div className="flex gap-2 border-b pb-2">
        <Skeleton className="h-9 w-24" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="rounded-lg border border-border p-6 space-y-3">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-9 w-36" />
    </div>
  </div>
);
