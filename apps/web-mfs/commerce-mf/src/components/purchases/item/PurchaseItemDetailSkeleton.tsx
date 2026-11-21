import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { DataTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { useParams } from 'react-router-dom';

const TABS = [
  { value: 'overview', width: 'w-24' },
  { value: 'allocations', width: 'w-28' },
  { value: 'quotes', width: 'w-20' },
  { value: 'documents', width: 'w-28' },
];
const STAT_COUNT = 6;
const FIELD_COUNT = 6;

// A card of label + value pairs, two to a row
const FieldsCardSkeleton = ({ fields }: { fields: number }) => (
  <CardSkeleton>
    <div className="flex flex-col gap-4 px-6">
      <Skeleton className="h-5 w-32" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: fields }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
          <div key={`field-${index}`} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </CardSkeleton>
);

// The progress card: title and summary, the bar, and each stage's quantity
const ProgressCardSkeleton = () => (
  <CardSkeleton>
    <div className="flex flex-col gap-4 px-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: STAT_COUNT }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
          <div key={`stat-${index}`} className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  </CardSkeleton>
);

// The purchase item page while it loads: header, the tab strip, and the opened tab — the overview's progress, site
// stock and item cards or a listing tab's table — and the danger zone below
export const PurchaseItemDetailSkeleton = () => {
  const { tab = 'overview' } = useParams();
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton showDescription showActions />
      <div className="flex flex-col gap-2">
        <div className="inline-flex h-9 w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5">
          {TABS.map(({ value, width }) => (
            <Skeleton key={value} className={`h-7 rounded-md ${width} ${value === tab ? 'bg-background' : ''}`} />
          ))}
        </div>
        {tab === 'overview' ? (
          <div className="flex flex-col gap-4">
            <ProgressCardSkeleton />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FieldsCardSkeleton fields={4} />
              <FieldsCardSkeleton fields={FIELD_COUNT} />
            </div>
          </div>
        ) : (
          <DataTableSkeleton mode="tab" columns={6} />
        )}
      </div>
      <DangerZoneSkeleton />
    </div>
  );
};
