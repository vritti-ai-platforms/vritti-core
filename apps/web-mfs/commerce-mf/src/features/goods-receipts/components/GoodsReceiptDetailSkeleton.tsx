import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailSectionSkeleton } from '@vritti/quantum-ui/DetailField';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Shared loading skeleton for the GR detail column: title row + stat plate + table toolbar + table.
export function GoodsReceiptDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSectionSkeleton count={3} />
      </div>
      <div className="flex items-center justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <CompactTableSkeleton
        rows={5}
        actions
        columns={[
          { headerWidth: 'w-20', cellWidth: 'w-28' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
        ]}
      />
    </div>
  );
}
