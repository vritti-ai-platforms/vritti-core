import { type DataTableMode, DataTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import type React from 'react';
import { Fragment } from 'react';

const STAGE_COUNT = 4;

// The stage bar while the purchase loads: a step marker and label per stage, joined by connectors
export const PurchaseStageBarSkeleton = () => (
  <div className="flex w-full items-start justify-between">
    {Array.from({ length: STAGE_COUNT }).map((_, stageIndex) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
      <Fragment key={`stage-${stageIndex}`}>
        {stageIndex > 0 && <Skeleton className="mx-4 mt-4 h-0.5 flex-1" />}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      </Fragment>
    ))}
  </div>
);

interface PurchaseStageViewSkeletonProps {
  // stepperTab when the view's own tabs sit between the stage bar and the table (Sourcing)
  mode?: Extract<DataTableMode, 'stepper' | 'stepperTab'>;
}

// A stage view while its data loads: the table it shows under the stage bar
export const PurchaseStageViewSkeleton: React.FC<PurchaseStageViewSkeletonProps> = ({ mode = 'stepper' }) => (
  <DataTableSkeleton mode={mode} columns={5} />
);

// The purchase detail while it loads: header, stage bar and the viewed stage's table
export const PurchaseDetailSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <PurchaseStageBarSkeleton />
    <PurchaseStageViewSkeleton />
  </div>
);
