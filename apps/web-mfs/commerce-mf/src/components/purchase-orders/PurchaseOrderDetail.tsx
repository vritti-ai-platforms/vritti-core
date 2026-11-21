import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { PartOfPurchaseChips } from '@/components/purchases/PartOfPurchaseChips';
import { documentPurchases } from '@/components/purchases/purchaseDocuments';
import type { PurchaseOrdersBinding } from './bindings';
import { PurchaseOrderActions } from './PurchaseOrderActions';
import {
  PurchaseOrderInvoiceStatusBadge,
  PurchaseOrderReceiptStatusBadge,
  PurchaseOrderStatusBadge,
} from './PurchaseOrderStatusBadge';
import { GoodsReceiptsTab } from './tabs/GoodsReceiptsTab';
import { InboundDeliveriesTab } from './tabs/InboundDeliveriesTab';
import { LineItemsTab } from './tabs/line-items/LineItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

interface PurchaseOrderDetailProps {
  binding: PurchaseOrdersBinding;
}

// `…/purchase-orders/<number~id>` — an order, its lines, the deliveries carrying them and the goods received against it;
// once confirmed its header shows how much is received and invoiced. The legal entity's names its site, and where the
// binding carries invoices the order's invoices get a tab; each listing tab shows how many rows it holds
export const PurchaseOrderDetail: React.FC<PurchaseOrderDetailProps> = ({ binding }) => {
  const { permissions, invoices } = binding;
  const { id } = useSlugParams('poSlug');
  const { data: purchaseOrder } = binding.usePurchaseOrder(id);
  const { data: itemIds } = binding.useItemIds(id);
  const { data: counts, isLoading: countsLoading } = binding.usePurchaseOrderCounts(id);
  const tracksReceipts = purchaseOrder.status === 'CONFIRMED' || purchaseOrder.status === 'DELIVERY_COMPLETED';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={purchaseOrder.poNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <PurchaseOrderStatusBadge status={purchaseOrder.status} />
            {tracksReceipts && <PurchaseOrderReceiptStatusBadge status={purchaseOrder.receiptStatus} />}
            {tracksReceipts && <PurchaseOrderInvoiceStatusBadge status={purchaseOrder.invoiceStatus} />}
            <PartOfPurchaseChips purchases={documentPurchases(purchaseOrder)} />
          </div>
        }
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
            label: 'Line Items',
            count: counts?.itemCount,
            countLoading: countsLoading,
            permission: permissions.view,
            content: <LineItemsTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          {
            value: 'deliveries',
            label: 'Inbound Deliveries',
            count: counts?.inboundDeliveryCount,
            countLoading: countsLoading,
            permission: permissions.view,
            content: <InboundDeliveriesTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          {
            value: 'receipts',
            label: 'Goods Receipts',
            count: counts?.goodsReceiptCount,
            countLoading: countsLoading,
            permission: permissions.view,
            content: <GoodsReceiptsTab binding={binding} purchaseOrder={purchaseOrder} />,
          },
          ...(invoices
            ? [
                {
                  value: 'invoices',
                  label: 'Invoices',
                  count: counts?.invoiceCount,
                  countLoading: countsLoading,
                  permission: invoices.permission,
                  content: <invoices.Tab purchaseOrder={purchaseOrder} />,
                },
              ]
            : []),
        ]}
        defaultValue="overview"
      />
    </div>
  );
};
