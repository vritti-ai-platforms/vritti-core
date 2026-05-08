import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const PurchaseOrderDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    {/* Page header — title + status pill, supplier description, primary action + Actions dropdown */}
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>

    {/* Overview / Line Items / Goods Receipts */}
    <TabsSkeleton count={3} tabWidths={['w-20', 'w-28', 'w-28']} />
  </div>
);
