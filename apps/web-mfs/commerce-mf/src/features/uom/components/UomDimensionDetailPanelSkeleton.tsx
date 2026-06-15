import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailSectionSkeleton } from '@vritti/quantum-ui/DetailField';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Loading content for the dimension detail panel: title + actions, the Description field, and the Units table.
export function UomDimensionDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSectionSkeleton count={1} wrap />
      </div>
      <CompactTableSkeleton
        rows={4}
        columns={[
          { headerWidth: 'w-24', cellWidth: 'w-32' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
        ]}
      />
    </div>
  );
}
