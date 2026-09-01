import { Card } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Mirrors ConfigTab — the info alert, count line, then the app card grid
export const ConfigTabSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-16 w-full rounded-lg" />
    <Skeleton className="h-4 w-48" />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {['a', 'b'].map((card) => (
        <Card key={card} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </Card>
      ))}
    </div>
  </div>
);
