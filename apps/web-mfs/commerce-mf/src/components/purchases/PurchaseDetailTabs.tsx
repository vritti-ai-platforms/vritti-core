import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import type { PurchaseDetail } from '@/schemas/purchases';
import type { PurchasesBinding } from './bindings';
import { PurchaseDocumentsTab } from './tabs/documents/PurchaseDocumentsTab';
import { PurchaseItemsTab } from './tabs/items/PurchaseItemsTab';
import { PurchaseOverviewTab } from './tabs/PurchaseOverviewTab';
import { PurchaseComparisonTab } from './tabs/quotations/PurchaseComparisonTab';
import { PurchaseQuotationsTab } from './tabs/quotations/PurchaseQuotationsTab';
import { PurchaseSuppliersTab } from './tabs/suppliers/PurchaseSuppliersTab';

interface PurchaseDetailTabsProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// A purchase's tabs, each listing tab with how many it holds: an overview of where it stands, its items, suppliers,
// quotations compared item by item (once it requires or has any), and the documents its suppliers created
export const PurchaseDetailTabs: React.FC<PurchaseDetailTabsProps> = ({ binding, purchase }) => {
  const { permissions } = binding;
  const { data: counts, isLoading: countsLoading } = binding.usePurchaseCounts(purchase.id);
  const tabProps = { binding, purchase };
  // Quotations matter once the purchase requires them, which is also where they are requested, or while it still has some
  const showsQuotations = purchase.quotationsRequired || (counts?.quotationCount ?? 0) > 0;

  return (
    <Tabs
      routeParam="tab"
      tabs={[
        { value: 'overview', label: 'Overview', content: <PurchaseOverviewTab {...tabProps} /> },
        {
          value: 'items',
          label: 'Items',
          count: counts?.itemCount,
          countLoading: countsLoading,
          permission: permissions.view,
          content: <PurchaseItemsTab {...tabProps} />,
        },
        {
          value: 'suppliers',
          label: 'Suppliers',
          count: counts?.supplierCount,
          countLoading: countsLoading,
          permission: permissions.view,
          content: <PurchaseSuppliersTab {...tabProps} />,
        },
        ...(showsQuotations
          ? [
              {
                value: 'quotations',
                label: 'Quotations',
                count: counts?.quotationCount,
                countLoading: countsLoading,
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
  );
};
