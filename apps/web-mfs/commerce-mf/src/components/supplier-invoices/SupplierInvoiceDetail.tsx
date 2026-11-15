import { Badge } from '@vritti/quantum-ui/Badge';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import type React from 'react';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { receiveWithInvoicePath } from '@/components/purchases/documentPaths';
import { PartOfPurchaseChips } from '@/components/purchases/PartOfPurchaseChips';
import type { SupplierInvoiceDetail as SupplierInvoiceDetailData } from '@/schemas/supplier-invoices';
import { workspaceBase } from '@/utils/workspace';
import type { SupplierInvoicesBinding } from './bindings';
import { SupplierInvoiceDeleteZone } from './SupplierInvoiceDeleteZone';
import { SupplierInvoiceHeaderActions } from './SupplierInvoiceHeaderActions';
import { SupplierInvoiceHoldsAlert } from './SupplierInvoiceHoldsAlert';
import { SupplierInvoiceHoldsTable } from './SupplierInvoiceHoldsTable';
import { SupplierInvoiceLinesTable } from './SupplierInvoiceLinesTable';
import { SupplierInvoiceOverview } from './SupplierInvoiceOverview';
import { SupplierInvoicePaymentStatusBadge } from './SupplierInvoicePaymentStatusBadge';
import { SupplierInvoiceStatusBadge } from './SupplierInvoiceStatusBadge';

interface SupplierInvoiceDetailProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoiceDetailData;
}

// A supplier invoice: its header, the receipts and charges it covers and the holds on its payment; drafts are posted
// here, holds released, and where the workspace may, invoices are cancelled and drafts deleted. A Receive with Invoice's draft
// opens on its Receive with Invoice screen instead
export const SupplierInvoiceDetail: React.FC<SupplierInvoiceDetailProps> = ({ binding, invoice }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { pathname } = useLocation();
  const isPosted = invoice.status === 'POSTED';

  // A Receive with Invoice's draft is entered on its Receive with Invoice screen, never in the invoice editor
  if (invoice.isReceiveWithInvoice && invoice.status === 'DRAFT') {
    return <Navigate replace to={receiveWithInvoicePath(workspaceBase(pathname), invoice)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.invoiceNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <SupplierInvoiceStatusBadge status={invoice.status} />
            {isPosted && <SupplierInvoicePaymentStatusBadge status={invoice.paymentStatus} />}
            {invoice.openHoldCount > 0 && (
              <Badge variant="warning">{`${pluralize('hold', invoice.openHoldCount, true)} on payment`}</Badge>
            )}
            {isPosted && invoice.openHoldCount === 0 && !invoice.isPayable && (
              <Badge variant="destructive">Payment blocked</Badge>
            )}
            <PartOfPurchaseChips purchases={invoice.purchases} />
          </div>
        }
        description={[invoice.supplierName, ...invoice.poNumbers].join(' · ')}
        actions={<SupplierInvoiceHeaderActions binding={binding} invoice={invoice} />}
      />

      <SupplierInvoiceHoldsAlert invoice={invoice} />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            permission: binding.permissions.view,
            content: <SupplierInvoiceOverview invoice={invoice} showSite={binding.spansSites} />,
          },
          {
            value: 'lines',
            label: `Lines (${invoice.lines.length})`,
            permission: binding.permissions.view,
            content: <SupplierInvoiceLinesTable binding={binding} invoice={invoice} />,
          },
          {
            value: 'holds',
            label: `Holds (${invoice.holds.length})`,
            permission: binding.permissions.view,
            content: <SupplierInvoiceHoldsTable binding={binding} invoice={invoice} />,
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {binding.removal && invoice.canDelete && (
        <SupplierInvoiceDeleteZone removal={binding.removal} invoice={invoice} listPath={binding.listPath} />
      )}
    </div>
  );
};
