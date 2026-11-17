import { CardSkeleton } from '@vritti/quantum-ui/Card';
import { DataTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { useParams } from 'react-router-dom';

const TABS = [
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

// The purchase item page while it loads: header, the progress card, the tab strip with the opened tab's table, and the
// site stock and item cards beside them
export const PurchaseItemDetailSkeleton = () => {
  const { tab = 'allocations' } = useParams();
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton showDescription showActions />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
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
          <div className="flex flex-col gap-2">
            <div className="inline-flex h-9 w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5">
              {TABS.map(({ value, width }) => (
                <Skeleton key={value} className={`h-7 rounded-md ${width} ${value === tab ? 'bg-background' : ''}`} />
              ))}
            </div>
            <DataTableSkeleton mode="tab" columns={6} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <FieldsCardSkeleton fields={4} />
          <FieldsCardSkeleton fields={FIELD_COUNT} />
        </div>
      </div>
    </div>
  );
};
