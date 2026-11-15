import { Badge } from '@vritti/quantum-ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { SUPPLIER_INVOICE_SOURCE_LABELS, type SupplierInvoiceDetail } from '@/schemas/supplier-invoices';
import { SupplierInvoicePaymentStatusBadge } from './SupplierInvoicePaymentStatusBadge';
import { SupplierInvoiceStatusBadge } from './SupplierInvoiceStatusBadge';

interface SupplierInvoiceOverviewProps {
  invoice: SupplierInvoiceDetail;
  showSite: boolean;
}

// An invoice's header: the orders it covers, its dates and payment term, its currency and rate, whether it can be paid,
// and its totals
export const SupplierInvoiceOverview = ({ invoice, showSite }: SupplierInvoiceOverviewProps) => {
  const workspaceCurrency = useWorkspaceCurrency();
  const foreignCurrency = invoice.currencyCode !== workspaceCurrency;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <DetailField label="Supplier" type="string" value={invoice.supplierName} />
          <DetailField
            label="Purchase Orders"
            type="string"
            mono
            value={invoice.poNumbers.length > 0 ? invoice.poNumbers.join(', ') : null}
          />
          {showSite && <DetailField label="Site" type="string" value={invoice.siteName} />}
          <DetailField label="Invoice Number" type="string" mono value={invoice.invoiceNumber} />
          <DetailField label="Invoice Date" type="date" value={invoice.invoiceDate} />
          <DetailField label="Tax Date" type="date" value={invoice.taxDate} />
          <DetailField label="Source" type="string" value={SUPPLIER_INVOICE_SOURCE_LABELS[invoice.source]} />
          <DetailField label="Status" type="string" value={<SupplierInvoiceStatusBadge status={invoice.status} />} />
          <DetailField label="Posted" type="dateTime" value={invoice.postedAt} />
          <DetailField label="Payment Term" type="string" value={invoice.paymentTermName} />
          <DetailField label="Due Date" type="date" value={invoice.dueDate} />
          <DetailField
            label="Payment"
            type="string"
            value={<SupplierInvoicePaymentStatusBadge status={invoice.paymentStatus} />}
          />
          <DetailField
            label="Payable"
            type="string"
            value={
              invoice.isPayable ? (
                <Badge variant="success">Payable</Badge>
              ) : (
                <Badge variant="outline">Not payable</Badge>
              )
            }
          />
          <DetailField label="Open Holds" type="number" value={invoice.openHoldCount} />
          <DetailField label="Currency" type="string" mono value={invoice.currencyCode} />
          {foreignCurrency && (
            <DetailField
              label={`Exchange Rate (${invoice.currencyCode} → ${workspaceCurrency})`}
              type="number"
              value={invoice.exchangeRate}
            />
          )}
          <DetailField label="Subtotal" type="currency" value={invoice.subtotal} />
          <DetailField label="Discount" type="currency" value={invoice.discountAmount} />
          <DetailField label="Tax" type="currency" value={invoice.taxAmount} />
          <DetailField label="Total" type="currency" value={invoice.totalAmount} exchangeRate={invoice.exchangeRate} />
          <DetailField label="Notes" type="string" value={invoice.notes} className="col-span-2" />
        </div>
      </CardContent>
    </Card>
  );
};
