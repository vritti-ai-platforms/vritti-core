import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { JobListSkeleton } from './components/actions/JobListSkeleton';

// One entry per DetailField in RunDetail's grid — named rather than indexed so the keys are stable
const DETAIL_FIELDS = ['workflow', 'branch', 'event', 'commit', 'actor', 'duration', 'started', 'completed'];

export const RunViewPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton />

    <div className="flex flex-col gap-4">
      <CardSkeleton>
        <div className="grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
          {DETAIL_FIELDS.map((field) => (
            <div key={field} className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      </CardSkeleton>

      {/* Mirrors the jobs card: a header strip above rows that reach the card's edges */}
      <CardSkeleton className="overflow-hidden py-0">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <Skeleton className="h-4 w-12" />
        </div>
        <JobListSkeleton />
      </CardSkeleton>
    </div>
  </div>
);
