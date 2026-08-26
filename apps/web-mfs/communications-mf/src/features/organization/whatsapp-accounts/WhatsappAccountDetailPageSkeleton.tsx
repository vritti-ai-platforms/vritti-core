import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

export const WhatsappAccountDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions={false} />

    {/* TabsSkeleton already stands in for the tab panel, so the page's last block is the danger zone */}
    <TabsSkeleton count={2} tabWidths={['w-24', 'w-32']} />

    <DangerZoneSkeleton />
  </div>
);
