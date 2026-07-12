import { Badge } from '@vritti/quantum-ui/Badge';
import { useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type { PurchaseOrderStatus } from '@/schemas/purchase-orders';
import { usePurchaseOrder, usePurchaseOrderItemsIds } from '@/site/hooks/purchase-orders';
import { PurchaseOrderActions } from './components/PurchaseOrderActions';
import { purchaseOrderStatusConfig } from './status-config';
import { GoodsReceiptsTab } from './tabs/GoodsReceiptsTab';
import { LineItemsTab } from './tabs/LineItemsTab';
import { OverviewTab } from './tabs/OverviewTab';

const EDITABLE_PO_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'];

export const PurchaseOrderDetailPage = () => {
  const { id } = useSlugParams('poSlug');
  const { data: po } = usePurchaseOrder(id);
  const { data: poItemIds } = usePurchaseOrderItemsIds(id);

  const statusBadgeConfig = purchaseOrderStatusConfig[po.status];
  const canModifyItems = EDITABLE_PO_STATUSES.includes(po.status) && !po.goodsReceiptExists;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={po.poNumber}
        titleSlot={
          <Badge variant={statusBadgeConfig.variant} className={statusBadgeConfig.className}>
            {statusBadgeConfig.label}
          </Badge>
        }
        description={po.supplierName}
        actions={<PurchaseOrderActions po={po} poItemIds={poItemIds} />}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: <OverviewTab po={po} status={statusBadgeConfig} />,
          },
          {
            value: 'items',
            label: `Line Items (${poItemIds.length})`,
            content: <LineItemsTab purchaseOrder={po} canModifyItems={canModifyItems} />,
          },
          {
            value: 'receipts',
            label: 'Goods Receipts',
            content: <GoodsReceiptsTab poId={po.id} />,
          },
        ]}
        defaultValue="overview"
      />
    </div>
  );
};
