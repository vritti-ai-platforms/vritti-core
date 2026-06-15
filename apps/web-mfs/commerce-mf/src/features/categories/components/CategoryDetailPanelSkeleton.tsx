import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { DetailSectionSkeleton } from '@vritti/quantum-ui/DetailField';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';

// Loading content for the category detail panel: title + actions, the detail fields, and the children/items table.
export function CategoryDetailPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-7 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      <div className="flex flex-nowrap items-start gap-2 overflow-x-auto">
        <DetailSectionSkeleton count={3} wrap />
      </div>
      <CompactTableSkeleton
        rows={4}
        actions
        columns={[
          { headerWidth: 'w-28', cellWidth: 'w-36' },
          { headerWidth: 'w-16', cellWidth: 'w-20' },
          { headerWidth: 'w-16', cellWidth: 'w-16' },
        ]}
      />
    </div>
  );
}
