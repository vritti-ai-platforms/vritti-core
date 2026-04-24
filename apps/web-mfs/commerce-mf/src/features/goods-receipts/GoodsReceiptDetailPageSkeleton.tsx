import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

export const GoodsReceiptDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton />
    <div className="flex gap-2 border-b">
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-9 w-28" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-20" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="col-span-2 h-14 w-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);
