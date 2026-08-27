import { Card } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Mirrors ConfigTab — the alert, the count line, then the two-column card grid
export const ConfigTabSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-4 w-56" />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {['first', 'second'].map((card) => (
        <Card key={card} className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-28" />
        </Card>
      ))}
    </div>
  </div>
);
