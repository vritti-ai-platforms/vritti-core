import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

const SUMMARY_KEYS = ['price', 'uom', 'scheme', 'min'];

export const SupplierItemDetailPageSkeleton = () => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription />
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {SUMMARY_KEYS.map((key) => (
        <Skeleton key={key} className="h-12 w-full" />
      ))}
    </div>
    <TabsSkeleton count={2} tabWidths={['w-20', 'w-16']} />
  </div>
);
