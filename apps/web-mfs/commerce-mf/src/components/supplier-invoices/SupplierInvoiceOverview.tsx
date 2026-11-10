import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import type { SupplierInvoiceDetail } from '@/schemas/supplier-invoices';
import { SupplierInvoiceStatusBadge } from './SupplierInvoiceStatusBadge';

interface SupplierInvoiceOverviewProps {
  invoice: SupplierInvoiceDetail;
  showSite: boolean;
}

// An invoice's header: what it bills, its dates, its currency and rate against the order's, and its totals
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
          <DetailField label="Purchase Order" type="string" mono value={invoice.poNumber} />
          {showSite && <DetailField label="Site" type="string" value={invoice.siteName ?? invoice.siteCode} />}
          <DetailField label="Invoice Number" type="string" mono value={invoice.invoiceNumber} />
          <DetailField label="Invoice Date" type="date" value={invoice.invoiceDate} />
          <DetailField label="Tax Date" type="date" value={invoice.taxDate} />
          <DetailField label="Status" type="string" value={<SupplierInvoiceStatusBadge status={invoice.status} />} />
          <DetailField label="Posted" type="dateTime" value={invoice.postedAt} />
          <DetailField label="Currency" type="string" mono value={invoice.currencyCode} />
          {foreignCurrency && (
            <DetailField
              label={`Exchange Rate (${invoice.currencyCode} → ${workspaceCurrency})`}
              type="number"
              value={invoice.exchangeRate}
            />
          )}
          {foreignCurrency && <DetailField label="Order Exchange Rate" type="number" value={invoice.poExchangeRate} />}
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
