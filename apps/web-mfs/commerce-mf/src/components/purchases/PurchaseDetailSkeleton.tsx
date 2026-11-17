import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { DataTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { useParams } from 'react-router-dom';

const TABS = [
  { value: 'overview', width: 'w-20' },
  { value: 'items', width: 'w-20' },
  { value: 'suppliers', width: 'w-24' },
  { value: 'quotations', width: 'w-28' },
  { value: 'comparison', width: 'w-24' },
  { value: 'documents', width: 'w-24' },
];
const KPI_COUNT = 4;
const LIST_ROWS = 4;

// The purchase's tab strip with the opened tab selected
const PurchaseTabStripSkeleton = ({ active }: { active: string }) => (
  <div className="inline-flex h-9 w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5">
    {TABS.map(({ value, width }) => (
      <Skeleton key={value} className={`h-7 rounded-md ${width} ${value === active ? 'bg-background' : ''}`} />
    ))}
  </div>
);

// A card listing what it links to: title, description and a row per entry
const PurchaseListCardSkeleton = () => (
  <CardSkeleton>
    <div className="flex flex-col gap-4 px-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      {Array.from({ length: LIST_ROWS }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
        <div key={`row-${index}`} className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  </CardSkeleton>
);

// The Overview tab: the count cards, the progress card, what needs attention beside the suppliers, and the danger zone
const PurchaseOverviewSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <CardSkeleton count={KPI_COUNT} className="py-4">
        <div className="flex flex-col gap-2 px-6">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </CardSkeleton>
    </div>
    <CardSkeleton>
      <div className="flex flex-col gap-4 px-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-80" />
      </div>
    </CardSkeleton>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PurchaseListCardSkeleton />
      <PurchaseListCardSkeleton />
    </div>
    <DangerZoneSkeleton />
    <DangerZoneSkeleton />
  </div>
);

// The purchase detail while it loads: header, tab strip and the opened tab — the overview cards, or a tab's table
export const PurchaseDetailSkeleton = () => {
  const { tab = 'overview' } = useParams();
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton showDescription showActions />
      <div className="flex flex-col gap-2">
        <PurchaseTabStripSkeleton active={tab} />
        {tab === 'overview' ? <PurchaseOverviewSkeleton /> : <DataTableSkeleton mode="tab" columns={5} />}
      </div>
    </div>
  );
};
