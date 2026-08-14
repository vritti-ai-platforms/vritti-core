import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// One entry per placeholder row — named rather than indexed so the keys are stable
const WORKFLOW_ROWS = ['first', 'second', 'third', 'fourth'];

// Mirrors WorkflowRow: a two-line name/path block on the left, the run and enable/disable buttons on the right
export const WorkflowsPanelSkeleton = () => (
  <div className="divide-y divide-border">
    {WORKFLOW_ROWS.map((row) => (
      <div key={row} className="flex items-center gap-1 px-4 py-2.5 pr-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-3 w-52" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <Skeleton className="size-9 shrink-0 rounded-md" />
      </div>
    ))}
  </div>
);
