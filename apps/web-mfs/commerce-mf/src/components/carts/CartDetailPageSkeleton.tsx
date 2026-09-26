import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { CompactTableSkeleton } from '@vritti/quantum-ui/DataTable';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';

export const CartDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions />
    <CompactTableSkeleton columns={5} actions />
    <DangerZoneSkeleton />
  </div>
);
