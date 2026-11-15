import { Badge } from '@vritti/quantum-ui/Badge';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SupplierInvoiceStatusBadge } from '@/components/supplier-invoices/SupplierInvoiceStatusBadge';
import { goodsReceiptStatusConfig } from '@/schemas/goods-receipts';
import { inboundDeliveryStatusConfig } from '@/schemas/inbound-deliveries';
import { purchaseOrderStatusConfig } from '@/schemas/purchase-orders';
import type { PurchaseLeg } from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { goodsReceiptPath, inboundDeliveryPath, purchaseInvoicePath, purchaseOrderPath } from '../documentPaths';

interface DocumentChipProps {
  to: string;
  number: string;
  children: React.ReactNode;
}

// A document's number linking to its page, followed by its status
const DocumentChip: React.FC<DocumentChipProps> = ({ to, number, children }) => (
  <span className="flex items-center gap-1.5">
    <Badge variant="outline" asChild>
      <Link to={to}>{number}</Link>
    </Badge>
    {children}
  </span>
);

// The chips of one kind of document, or nothing for the field to show its dash
function chipRow(chips: React.ReactNode[]): React.ReactNode {
  return chips.length > 0 ? <span className="flex flex-wrap items-center gap-3">{chips}</span> : null;
}

interface PurchaseLegDocumentsProps {
  binding: PurchasesBinding;
  leg: PurchaseLeg;
}

// The documents the leg's actions created, each opening in its own feature; a Receive with Invoice draft opens on the
// Receive with Invoice screen, where it is edited until posted
export const PurchaseLegDocuments: React.FC<PurchaseLegDocumentsProps> = ({ binding, leg }) => {
  const { pathname } = useLocation();
  const workspace = workspaceBase(pathname);
  const { purchaseOrders, deliveries, receipts, invoices } = leg.documents;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <DetailField
        label="Purchase Orders"
        type="string"
        value={chipRow(
          purchaseOrders.map((order) => (
            <DocumentChip key={order.id} to={purchaseOrderPath(workspace, order)} number={order.poNumber}>
              <Badge variant={purchaseOrderStatusConfig[order.status].variant}>
                {purchaseOrderStatusConfig[order.status].label}
              </Badge>
            </DocumentChip>
          )),
        )}
      />
      <DetailField
        label="Inbound Deliveries"
        type="string"
        value={chipRow(
          deliveries.map((delivery) => (
            <DocumentChip
              key={delivery.id}
              to={inboundDeliveryPath(workspace, delivery)}
              number={delivery.deliveryNumber}
            >
              <Badge variant={inboundDeliveryStatusConfig[delivery.status].variant}>
                {inboundDeliveryStatusConfig[delivery.status].label}
              </Badge>
            </DocumentChip>
          )),
        )}
      />
      <DetailField
        label="Goods Receipts"
        type="string"
        value={chipRow(
          receipts.map((receipt) => (
            <DocumentChip key={receipt.id} to={goodsReceiptPath(workspace, receipt)} number={receipt.grNumber}>
              <Badge variant={goodsReceiptStatusConfig[receipt.status].variant}>
                {goodsReceiptStatusConfig[receipt.status].label}
              </Badge>
            </DocumentChip>
          )),
        )}
      />
      <DetailField
        label="Supplier Invoices"
        type="string"
        value={chipRow(
          invoices.map((invoice) => (
            <DocumentChip
              key={invoice.id}
              to={purchaseInvoicePath(workspace, binding.invoicePath, invoice, leg)}
              number={invoice.invoiceNumber}
            >
              <SupplierInvoiceStatusBadge status={invoice.status} />
              {invoice.isReceiveWithInvoice && <Badge variant="outline">Receive with Invoice</Badge>}
              {invoice.openHoldCount > 0 && (
                <Badge variant="warning">{pluralize('hold', invoice.openHoldCount, true)}</Badge>
              )}
            </DocumentChip>
          )),
        )}
      />
    </div>
  );
};
