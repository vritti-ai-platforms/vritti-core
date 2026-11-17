import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { Pencil } from 'lucide-react';
import type React from 'react';
import { StockStatusBadge } from '@/components/inventory-items/StockStatusBadge';
import { PurchaseActionValues, PurchaseItemProblemCodeValues, purchaseStatusConfig } from '@/schemas/purchases';
import type { PurchasesBinding } from '../bindings';
import { EditPurchaseItemDialog } from '../forms/EditPurchaseItemDialog';
import { PurchaseStatusBadge } from '../PurchaseStatusBadge';
import { PurchaseItemProblems } from '../tabs/items/PurchaseItemProblems';
import { PurchaseItemAllocationsTab } from './PurchaseItemAllocationsTab';
import { PurchaseItemDocumentsTab } from './PurchaseItemDocumentsTab';
import { PurchaseItemInfoCard } from './PurchaseItemInfoCard';
import { PurchaseItemProgressCard } from './PurchaseItemProgressCard';
import { PurchaseItemQuotesTab } from './PurchaseItemQuotesTab';
import { PurchaseItemSiteStockCard } from './PurchaseItemSiteStockCard';

interface PurchaseItemViewProps {
  binding: PurchasesBinding;
}

// `…/purchases/<number~id>/items/<name~id>/<tab>` — one purchase item: its header with what stops it being bought, how
// far it has got, its allocations, quotes and documents a table each, and its stock at the purchase's site
export const PurchaseItemView: React.FC<PurchaseItemViewProps> = ({ binding }) => {
  const fmt = useFormatters();
  const { permissions } = binding;
  const { purchaseSlug, itemSlug } = useSlugParams('purchaseSlug', 'itemSlug');
  const { data: purchase } = binding.usePurchase(purchaseSlug.id);
  const { data: item } = binding.usePurchaseItem(purchase.id, itemSlug.id);
  const { data: counts } = binding.usePurchaseItemCounts(purchase.id, item.id);
  const { data: siteStock } = binding.usePurchaseItemSiteStock(purchase.id, item.id);
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const editDialog = useDialog();

  const availableActions = actions?.availableActions ?? [];
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  const blocked = item.problems.find((problem) => problem.code === PurchaseItemProblemCodeValues.PURCHASING_BLOCKED);
  const canEdit = availableActions.includes(PurchaseActionValues.EDIT_ITEMS);
  const isOpenForAllocation = availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS);
  const canAllocate = isOpenForAllocation && blocked === undefined;
  const allocateTip = isOpenForAllocation ? (blocked?.detail ?? '') : closedTip;
  // Quotes matter once the purchase requires them, or while the item still has some
  const showsQuotes = purchase.quotationsRequired || (counts?.quoteCount ?? 0) > 0;
  const withCount = (label: string, count: number | undefined) =>
    count === undefined ? label : `${label} (${fmt.number(count).primary})`;
  const tabProps = { binding, purchase, item };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={item.inventoryItemName}
        titleSlot={
          <div className="flex items-center gap-2">
            {item.problems.length > 0 && <PurchaseItemProblems problems={item.problems} />}
            {siteStock && <StockStatusBadge status={siteStock.stockStatus} />}
            <PurchaseStatusBadge purchase={purchase} />
          </div>
        }
        description={[
          purchase.purchaseNumber,
          purchase.siteName,
          item.neededBy && `Needed by ${fmt.date(item.neededBy).primary}`,
        ]
          .filter(Boolean)
          .join(' · ')}
        actions={
          <Button
            variant="outline"
            size="sm"
            permission={permissions.edit}
            startAdornment={<Pencil className="size-4" />}
            onClick={editDialog.open}
            disabled={!canEdit}
            disabledTip={closedTip}
          >
            Edit
          </Button>
        }
      />

      {blocked && (
        <Alert
          variant="warning"
          title={blocked.detail}
          description="Goods already ordered still arrive and are invoiced. It can't be allocated further, and suppliers holding it can't be submitted or ordered until those allocations are removed."
        />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <PurchaseItemProgressCard binding={binding} purchase={purchase} item={item} />
          <Tabs
            routeParam="tab"
            tabs={[
              {
                value: 'allocations',
                label: withCount('Allocations', counts?.allocationCount),
                permission: permissions.view,
                content: (
                  <PurchaseItemAllocationsTab {...tabProps} canAllocate={canAllocate} allocateTip={allocateTip} />
                ),
              },
              ...(showsQuotes
                ? [
                    {
                      value: 'quotes',
                      label: withCount('Quotes', counts?.quoteCount),
                      permission: permissions.quotations.view,
                      content: (
                        <PurchaseItemQuotesTab {...tabProps} canAllocate={canAllocate} allocateTip={allocateTip} />
                      ),
                    },
                  ]
                : []),
              {
                value: 'documents',
                label: withCount('Documents', counts?.documentCount),
                permission: permissions.view,
                content: <PurchaseItemDocumentsTab {...tabProps} />,
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-4">
          <PurchaseItemSiteStockCard binding={binding} purchase={purchase} item={item} />
          <PurchaseItemInfoCard item={item} />
        </div>
      </div>

      <Dialog
        handle={editDialog}
        icon={Pencil}
        title="Edit Item"
        description={`Change how much ${item.inventoryItemName} the purchase needs.`}
        content={(close) => (
          <EditPurchaseItemDialog
            binding={binding}
            purchase={purchase}
            item={item}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
