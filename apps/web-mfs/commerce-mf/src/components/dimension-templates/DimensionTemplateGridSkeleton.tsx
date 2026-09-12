import { Card } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Mirrors the card grid's layout — same columns, gap and internal rhythm — so nothing shifts on load.
// The page header is not part of this: it renders instantly with its static title.
export const DimensionTemplateGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {[0, 1, 2, 3, 4, 5].map((key) => (
      <Card key={key} className="flex flex-col gap-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <Skeleton className="h-4 w-full" />

        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>

        <div className="mt-auto flex items-center justify-between border-t pt-3">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </Card>
    ))}
  </div>
);
