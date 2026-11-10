import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { useState } from 'react';
import type { SupplierQuotationsBinding } from '../../bindings';
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
  const [activeTab, setActiveTab] = useState('overview');
  const authoring = binding.authoring;
  const { view, mrpView } = binding.permissions;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={quotation.quotationNumber}
        titleSlot={<QuotationStatusBadge status={quotation.status} />}
        description={supplierName}
        actions={authoring && <authoring.HeaderActions supplierId={supplierId} quotation={quotation} />}
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: view,
            content: (
              <QuotationOverview quotation={quotation} supplierName={supplierName} showPostedSites={!!authoring} />
            ),
          },
          {
            value: 'items',
            label: `Items (${quotation.items.length})`,
            permission: view,
            content: authoring ? (
              <authoring.LinesTab supplierId={supplierId} quotation={quotation} />
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
          ...(authoring
            ? [
                {
                  value: 'sites',
                  label: `Sites (${quotation.sites.length})`,
                  permission: view,
                  content: <authoring.SitesTab supplierId={supplierId} quotation={quotation} />,
                },
              ]
            : []),
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {authoring && <authoring.DeleteZone supplierId={supplierId} quotation={quotation} />}
    </div>
  );
};
