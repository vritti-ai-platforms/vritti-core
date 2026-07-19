import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const SupplierDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <TabsSkeleton count={4} tabWidths={['w-20', 'w-16', 'w-16', 'w-20']} />
    <DangerZoneSkeleton />
  </div>
);
