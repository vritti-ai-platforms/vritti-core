import { Card, CardContent, CardHeader } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Mirrors the dimension cards — same header row, value chips and spacing — so the list does not jump
// when the data lands. Stands in for the SKU-order strip too, since that renders from the same fetch.
export const DimensionsSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-12 w-full rounded-lg" />

    <div className="flex flex-col gap-3">
      {[0, 1].map((key) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-0.5 size-5 rounded" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-16" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-14 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);
