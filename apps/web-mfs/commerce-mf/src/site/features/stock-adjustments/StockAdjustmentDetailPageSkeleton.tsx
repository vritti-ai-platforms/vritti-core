import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

// Mirrors StockAdjustmentDetailPage on the Overview-tab landing state.
export const StockAdjustmentDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />

    <TabsSkeleton count={2} tabWidths={['w-20', 'w-24']} />

    <DangerZoneSkeleton />
  </div>
);
