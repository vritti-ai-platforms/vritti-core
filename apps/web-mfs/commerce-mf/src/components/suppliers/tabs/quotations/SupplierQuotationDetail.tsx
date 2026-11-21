import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { useState } from 'react';
import type { SupplierQuotationsBinding } from '../../bindings';
import { QuotationDeleteZone } from './authoring/QuotationDeleteZone';
import { QuotationHeaderActions } from './authoring/QuotationHeaderActions';
import { QuotationLinesTab } from './authoring/QuotationLinesTab';
import { QuotationSitesTab } from './authoring/QuotationSitesTab';
import { QuotationItemsTable } from './QuotationItemsTable';
import { QuotationOverview } from './QuotationOverview';
import { QuotationStatusBadge } from './QuotationStatusBadge';

interface SupplierQuotationDetailProps {
  binding: SupplierQuotationsBinding;
}

// `…/suppliers/<supplier>/quotations/<number~id>` — a supplier's quotation and its lines; authoring adds editing, the
// sites it is posted to and deleting it
export const SupplierQuotationDetail: React.FC<SupplierQuotationDetailProps> = ({ binding }) => {
  const { supplierId, quotationId } = binding.useQuotationRef();
  const supplierName = binding.useSupplierName(supplierId);
  const { data: quotation } = binding.useQuotation(supplierId, quotationId);
  const { data: counts, isLoading: countsLoading } = binding.useQuotationCounts(supplierId, quotationId);
  const [activeTab, setActiveTab] = useState('overview');
  const authoring = binding.authoring;
  const { view, mrpView } = binding.permissions;
  const slot = authoring && { binding, authoring, supplierId, quotation };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quotation.quotationNumber}
        titleSlot={<QuotationStatusBadge status={quotation.status} />}
        description={supplierName}
        actions={slot && <QuotationHeaderActions {...slot} />}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: view,
            content: <QuotationOverview quotation={quotation} supplierName={supplierName} showPostedSites={!!slot} />,
          },
          {
            value: 'items',
            label: 'Items',
            count: counts?.itemCount,
            countLoading: countsLoading,
            permission: view,
            content: slot ? (
              <QuotationLinesTab {...slot} />
            ) : (
              <QuotationItemsTable
                quotation={quotation}
                queryKey={binding.quotationKey(supplierId, quotation.id)}
                permission={view}
                mrpPermission={mrpView}
                emptyDescription="The quotation has no lines."
              />
            ),
          },
          ...(slot
            ? [
                {
                  value: 'sites',
                  label: 'Sites',
                  count: counts?.siteCount,
                  countLoading: countsLoading,
                  permission: view,
                  content: <QuotationSitesTab {...slot} />,
                },
              ]
            : []),
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {slot && <QuotationDeleteZone {...slot} />}
    </div>
  );
};
