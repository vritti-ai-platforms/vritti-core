import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailSection } from '@vritti/quantum-ui/DetailField';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Shared loading skeleton for the GR detail column: title row + stat plate + table toolbar + table.
export function GoodsReceiptDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
      <DetailSection>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: <static skeleton list>
            key={`gr-stat-${i}`}
            className="space-y-1.5 px-4 py-2"
          >
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </DetailSection>
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
