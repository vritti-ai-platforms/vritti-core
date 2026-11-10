import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import type { PurchaseOrdersBinding } from './bindings';
import { PurchaseOrderActions } from './PurchaseOrderActions';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';
import { GoodsReceiptsTab } from './tabs/GoodsReceiptsTab';
import { InboundDeliveriesTab } from './tabs/InboundDeliveriesTab';
import { LineItemsTab } from './tabs/line-items/LineItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

interface PurchaseOrderDetailProps {
  binding: PurchaseOrdersBinding;
}

// `…/purchase-orders/<number~id>` — an order, its lines, the deliveries carrying them and the goods received against it; the legal entity's names
// its site, and where the binding carries invoices the order's invoices get a tab
export const PurchaseOrderDetail: React.FC<PurchaseOrderDetailProps> = ({ binding }) => {
  const { permissions, invoices } = binding;
  const { id } = useSlugParams('poSlug');
  const { data: purchaseOrder } = binding.usePurchaseOrder(id);
  const { data: itemIds } = binding.useItemIds(id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={purchaseOrder.poNumber}
        titleSlot={<PurchaseOrderStatusBadge status={purchaseOrder.status} />}
        description={
          purchaseOrder.siteName
            ? `${purchaseOrder.supplierName} · ${purchaseOrder.siteName}`
            : purchaseOrder.supplierName
        }
        actions={<PurchaseOrderActions binding={binding} purchaseOrder={purchaseOrder} hasLines={itemIds.length > 0} />}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: permissions.view,
            content: <OverviewTab purchaseOrder={purchaseOrder} showSite={binding.spansSites} />,
          },
          {
            value: 'items',
            label: `Line Items (${itemIds.length})`,
            permission: permissions.view,
            content: <LineItemsTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          {
            value: 'deliveries',
            label: 'Inbound Deliveries',
            permission: permissions.view,
            content: <InboundDeliveriesTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          {
            value: 'receipts',
            label: 'Goods Receipts',
            permission: permissions.view,
            content: <GoodsReceiptsTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          ...(invoices
            ? [
                {
                  value: 'invoices',
                  label: 'Invoices',
                  permission: invoices.permission,
                  content: <invoices.Tab purchaseOrderId={purchaseOrder.id} />,
                },
              ]
            : []),
        ]}
        defaultValue="overview"
      />
    </div>
  );
};
