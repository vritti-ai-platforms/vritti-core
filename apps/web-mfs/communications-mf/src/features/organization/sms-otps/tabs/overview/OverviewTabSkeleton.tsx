import { Card } from '@vritti/quantum-ui/Card';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Mirrors OverviewTab — the stat strip, then a wide chart beside a narrow one
export const OverviewTabSkeleton = () => (
  <div className="flex flex-col gap-6">
    <Card className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
      {['sent', 'verified', 'failed', 'rate'].map((tile) => (
        <div key={tile} className="flex flex-1 flex-col gap-1.5 px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
      ))}
    </Card>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 p-4">
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="p-4">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  </div>
);
