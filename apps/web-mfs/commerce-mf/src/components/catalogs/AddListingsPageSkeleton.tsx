import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import type React from 'react';

// Stands in for the first step only — the variant cards do not exist until an offering is chosen
export const AddListingsPageSkeleton: React.FC = () => (
  <div className="mx-auto flex w-full max-w-6xl flex-col">
    <PageHeaderSkeleton showDescription showActions />

    <div className="flex items-center gap-3 pt-6">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex flex-1 items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-24" />
          {index < 2 ? <Skeleton className="h-0.5 flex-1" /> : null}
        </div>
      ))}
    </div>

    <div className="flex flex-col gap-4 py-6">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-9 w-full" />
      <div className="flex items-center justify-between border-t pt-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  </div>
);
