import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { PartOfPurchaseChips } from '@/components/purchases/PartOfPurchaseChips';
import { documentPurchases } from '@/components/purchases/purchaseDocuments';
import type { InboundDeliveriesBinding } from './bindings';
import { DeleteInboundDeliveryZone } from './DeleteInboundDeliveryZone';
import { InboundDeliveryActions } from './InboundDeliveryActions';
import { InboundDeliveryStatusBadge } from './InboundDeliveryStatusBadge';
import { LinesTab } from './tabs/lines/LinesTab';
import { OverviewTab } from './tabs/OverviewTab';

interface InboundDeliveryDetailProps {
  binding: InboundDeliveriesBinding;
}

// `…/inbound-deliveries/<number~id>` — a supplier's delivery and the purchase order lines it carries; where the binding
// enters deliveries it is moved along, edited or deleted, and an announced one is received into a goods receipt
export const InboundDeliveryDetail: React.FC<InboundDeliveryDetailProps> = ({ binding }) => {
  const { mutations, viewPermission } = binding;
  const { id } = useSlugParams('deliverySlug');
  const { data: delivery } = binding.useInboundDelivery(id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={delivery.deliveryNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <InboundDeliveryStatusBadge status={delivery.status} />
            <PartOfPurchaseChips purchases={documentPurchases(delivery)} />
          </div>
        }
        description={[delivery.supplierName, delivery.siteName].filter(Boolean).join(' · ')}
        actions={<InboundDeliveryActions binding={binding} delivery={delivery} />}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: viewPermission,
            content: (
              <OverviewTab delivery={delivery} showSite={binding.spansSites}>
                {mutations && delivery.canDelete && (
                  <DeleteInboundDeliveryZone mutations={mutations} delivery={delivery} />
                )}
              </OverviewTab>
            ),
          },
          {
            value: 'lines',
            label: `Lines (${delivery.lineCount})`,
            permission: viewPermission,
            content: <LinesTab binding={binding} delivery={delivery} />,
          },
        ]}
        defaultValue="overview"
      />
    </div>
  );
};
