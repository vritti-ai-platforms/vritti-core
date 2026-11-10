import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
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
// enters deliveries it is moved along, edited, received into a goods receipt or deleted
export const InboundDeliveryDetail: React.FC<InboundDeliveryDetailProps> = ({ binding }) => {
  const { mutations, viewPermission } = binding;
  const { id } = useSlugParams('deliverySlug');
  const { data: delivery } = binding.useInboundDelivery(id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={delivery.deliveryNumber}
        titleSlot={<InboundDeliveryStatusBadge status={delivery.status} />}
        description={[
          delivery.supplierName,
          delivery.siteName,
          delivery.source === 'RECEIPT' ? `From receipt ${delivery.sourceGrNumber}` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={mutations && <InboundDeliveryActions mutations={mutations} delivery={delivery} />}
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
