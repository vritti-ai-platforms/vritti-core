import { Alert } from '@vritti/quantum-ui/Alert';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ExternalLink } from 'lucide-react';
import type React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ReceiveWithInvoiceDetail } from '@/schemas/receive-with-invoices';
import { SupplierInvoiceHoldStatusValues } from '@/schemas/supplier-invoices';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';
import { goodsReceiptPath } from '../documentPaths';
import { PartOfPurchaseChips } from '../PartOfPurchaseChips';
import { ReceiveWithInvoiceHoldsTable } from './ReceiveWithInvoiceHoldsTable';
import { ReceiveWithInvoiceLinesTable } from './ReceiveWithInvoiceLinesTable';
import { ReceiveWithInvoiceTotalsCard } from './ReceiveWithInvoiceTotalsCard';
import { receiveWithInvoiceTotals } from './receiveWithInvoiceLines';

interface ReceiveWithInvoicePostedProps {
  binding: PurchasesBinding;
  invoice: ReceiveWithInvoiceDetail;
}

// A posted Receive with Invoice, read only: its header, the receipts it posted, its lines and totals, and the holds it
// raised on its payment — released from its invoice in the supplier's invoices
export const ReceiveWithInvoicePosted: React.FC<ReceiveWithInvoicePostedProps> = ({ binding, invoice }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const workspace = workspaceBase(pathname);
  const leCurrencyCode = useWorkspaceCurrency();
  const isForeign = invoice.currencyCode !== leCurrencyCode;
  const openHoldCount = invoice.holds.filter((hold) => hold.status === SupplierInvoiceHoldStatusValues.OPEN).length;
  const invoicePath = binding.invoicePath({
    id: invoice.supplierInvoiceId,
    invoiceNumber: invoice.invoiceNumber,
    supplierId: invoice.supplierId,
    supplierName: invoice.supplierName,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.invoiceNumber}
        titleSlot={
          <div className="flex items-center gap-2">
            <Badge variant="success">Posted</Badge>
            {openHoldCount > 0 && (
              <Badge variant="warning">{`${pluralize('hold', openHoldCount, true)} on payment`}</Badge>
            )}
            <PartOfPurchaseChips purchases={invoice.purchases} />
          </div>
        }
        description={`Receive with Invoice from ${invoice.supplierName}`}
        actions={
          <Button
            size="sm"
            variant="outline"
            permission={binding.permissions.view}
            startAdornment={<ExternalLink className="size-4" />}
            onClick={() => navigate(`${workspace}/${invoicePath}`)}
          >
            Open Invoice
          </Button>
        }
      />

      {openHoldCount > 0 && (
        <Alert
          variant="warning"
          title={`Payment blocked by ${pluralize('open hold', openHoldCount, true)}`}
          description="Release them with a reason on the invoice's Holds tab, or correct the lines they are on."
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <DetailField label="Supplier" type="string" value={invoice.supplierName} />
            <DetailField label="Invoice Number" type="string" mono value={invoice.invoiceNumber} />
            <DetailField label="Invoice Date" type="date" value={invoice.invoiceDate} />
            <DetailField label="Tax Date" type="date" value={invoice.taxDate} />
            <DetailField label="Currency" type="string" mono value={invoice.currencyCode} />
            {isForeign && (
              <DetailField
                label={`1 ${invoice.currencyCode} in ${leCurrencyCode}`}
                type="number"
                value={invoice.exchangeRate}
              />
            )}
            <DetailField label="Received" type="dateTime" value={invoice.receivedDate} />
            <DetailField label="Delivery Note No." type="string" mono value={invoice.supplierDeliveryNoteNumber} />
            <DetailField
              label="Goods Receipts"
              type="string"
              value={
                <span className="flex flex-wrap items-center gap-2">
                  {invoice.goodsReceipts.map((receipt) => (
                    <Badge key={receipt.id} variant="outline" asChild>
                      <Link to={goodsReceiptPath(workspace, receipt)}>{receipt.grNumber}</Link>
                    </Badge>
                  ))}
                </span>
              }
            />
            <DetailField label="Notes" type="string" value={invoice.notes} className="col-span-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <ReceiveWithInvoiceLinesTable lines={invoice.lines} currencyCode={invoice.currencyCode} isLoading={false} />
        </CardContent>
      </Card>

      <ReceiveWithInvoiceTotalsCard
        totals={receiveWithInvoiceTotals(invoice.lines, invoice.currencyCode)}
        exchangeRate={isForeign ? invoice.exchangeRate : undefined}
      />

      <Card>
        <CardHeader>
          <CardTitle>Holds</CardTitle>
        </CardHeader>
        <CardContent>
          <ReceiveWithInvoiceHoldsTable holds={invoice.holds} />
        </CardContent>
      </Card>
    </div>
  );
};
