import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// One entry per placeholder row — named rather than indexed so the keys are stable
const JOB_ROWS = ['first', 'second', 'third'];

// Mirrors JobRow: a collapsible name on the left, duration + status + the logs button on the right.
// Shared by RunDetail's in-page loading state and RunViewPageSkeleton so both read identically.
export const JobListSkeleton = () => (
  <div className="divide-y divide-border">
    {JOB_ROWS.map((row) => (
      <div key={row} className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    ))}
  </div>
);
