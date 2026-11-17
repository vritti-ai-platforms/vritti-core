import { useFormatters, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import type { PurchasesBinding } from './bindings';
import { PurchaseDetailActions } from './PurchaseDetailActions';
import { PurchaseStatusBadge } from './PurchaseStatusBadge';
import { PurchaseSummaryBadge } from './PurchaseSummaryBadge';
import { PurchaseDocumentsTab } from './tabs/documents/PurchaseDocumentsTab';
import { PurchaseItemsTab } from './tabs/items/PurchaseItemsTab';
import { PurchaseOverviewTab } from './tabs/PurchaseOverviewTab';
import { PurchaseComparisonTab } from './tabs/quotations/PurchaseComparisonTab';
import { PurchaseQuotationsTab } from './tabs/quotations/PurchaseQuotationsTab';
import { PurchaseSuppliersTab } from './tabs/suppliers/PurchaseSuppliersTab';

interface PurchaseDetailProps {
  binding: PurchasesBinding;
}

// `…/purchases/<number~id>/<tab>` — a purchase's header with its actions, and its tabs: an overview of where it stands,
// its items, suppliers, quotations compared item by item (once it requires or has any), and the documents its suppliers
// created
export const PurchaseDetail: React.FC<PurchaseDetailProps> = ({ binding }) => {
  const fmt = useFormatters();
  const { permissions } = binding;
  const { id } = useSlugParams('purchaseSlug');
  const { data: purchase } = binding.usePurchase(id);
  const { data: counts } = binding.usePurchaseCounts(id);
  const { data: progress } = binding.usePurchaseProgress(id);
  const tabProps = { binding, purchase };
  // Quotations matter once the purchase requires them, which is also where they are requested, or while it still has some
  const showsQuotations = purchase.quotationsRequired || (counts?.quotationCount ?? 0) > 0;
  const withCount = (label: string, count: number | undefined) =>
    count === undefined ? label : `${label} (${fmt.number(count).primary})`;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={purchase.purchaseNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            {progress && <PurchaseSummaryBadge purchase={progress} />}
            <PurchaseStatusBadge
              purchase={purchase}
              tip={purchase.cancelReason && `Cancelled: “${purchase.cancelReason}”`}
            />
          </div>
        }
        description={[purchase.siteName, `Created ${fmt.date(purchase.createdAt).primary}`].filter(Boolean).join(' · ')}
        actions={<PurchaseDetailActions binding={binding} purchase={purchase} />}
      />

      <Tabs
        routeParam="tab"
        tabs={[
          { value: 'overview', label: 'Overview', content: <PurchaseOverviewTab {...tabProps} /> },
          {
            value: 'items',
            label: withCount('Items', counts?.itemCount),
            permission: permissions.view,
            content: <PurchaseItemsTab {...tabProps} />,
          },
          {
            value: 'suppliers',
            label: withCount('Suppliers', counts?.supplierCount),
            permission: permissions.view,
            content: <PurchaseSuppliersTab {...tabProps} />,
          },
          ...(showsQuotations
            ? [
                {
                  value: 'quotations',
                  label: withCount('Quotations', counts?.quotationCount),
                  permission: permissions.quotations.view,
                  content: <PurchaseQuotationsTab {...tabProps} />,
                },
                {
                  value: 'comparison',
                  label: 'Comparison',
                  permission: permissions.quotations.view,
                  content: <PurchaseComparisonTab {...tabProps} />,
                },
              ]
            : []),
          {
            value: 'documents',
            label: 'Documents',
            permission: permissions.view,
            content: <PurchaseDocumentsTab {...tabProps} />,
          },
        ]}
      />
    </div>
  );
};
