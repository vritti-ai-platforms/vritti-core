import { DangerZoneSkeleton } from '@vritti/quantum-ui/DangerZone';
import { PageHeaderSkeleton } from '@vritti/quantum-ui/PageHeader';
import { TabsSkeleton } from '@vritti/quantum-ui/Tabs';

interface SupplierQuotationPageSkeletonProps {
  // Whether the page can change the quotation: header actions, the Sites tab and the danger zone
  editable?: boolean;
}

export const SupplierQuotationPageSkeleton = ({ editable = false }: SupplierQuotationPageSkeletonProps) => (
  <div className="flex flex-col gap-6">
    <PageHeaderSkeleton showDescription showActions={editable} />
    <TabsSkeleton count={editable ? 3 : 2} tabWidths={editable ? ['w-20', 'w-16', 'w-16'] : ['w-20', 'w-16']} />
    {editable && <DangerZoneSkeleton />}
  </div>
);
