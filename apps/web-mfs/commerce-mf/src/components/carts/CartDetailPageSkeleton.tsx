import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const CartDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />

    {/* Overview / Items */}
    <TabsSkeleton count={2} tabWidths={['w-24', 'w-20']} />

    <DangerZoneSkeleton />
  </div>
);
