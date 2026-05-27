import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { useDialog, useSlugParams } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { Spinner } from '@vritti/quantum-ui/Spinner';
import { Tabs } from '@vritti/quantum-ui/Tabs';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useInvoice } from '@/hooks/invoices';
import { usePayments } from '@/hooks/payments';
import type { InvoiceStatus, InvoiceType } from '@/schemas/invoices';
import { RecordPaymentDialog } from './forms/RecordPaymentDialog';

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: 'secondary' | 'outline' | 'destructive'; className?: string }
> = {
  DRAFT: { label: 'Draft', variant: 'outline' },
  ISSUED: { label: 'Issued', variant: 'secondary' },
  PARTIALLY_PAID: { label: 'Partial', variant: 'secondary', className: 'bg-warning/15 text-warning' },
  PAID: { label: 'Paid', variant: 'secondary', className: 'bg-success/15 text-success' },
  OVERDUE: { label: 'Overdue', variant: 'destructive' },
  VOID: { label: 'Void', variant: 'outline' },
};

const typeConfig: Record<InvoiceType, { label: string; className: string }> = {
  PAYABLE: { label: 'Payable', className: 'bg-warning/15 text-warning' },
  RECEIVABLE: { label: 'Receivable', className: 'bg-success/15 text-success' },
};

export const InvoiceDetailPage = () => {
  const { id } = useSlugParams('invoiceSlug');
  const { data: invoice, isLoading } = useInvoice(id ?? null);
  const { data: payments, isLoading: isLoadingPayments } = usePayments(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const paymentDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!invoice) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Invoice not found.</div>;
  }

  const statusBadge = statusConfig[invoice.status];
  const typeBadge = typeConfig[invoice.type];
  const canRecordPayment = invoice.status !== 'PAID' && invoice.status !== 'VOID' && invoice.balance > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.partyName}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={typeBadge.className}>
              {typeBadge.label}
            </Badge>
            <Badge variant={statusBadge.variant} className={statusBadge.className}>
              {statusBadge.label}
            </Badge>
            {canRecordPayment && (
              <Button size="sm" startAdornment={<CreditCard className="size-4" />} onClick={paymentDialog.open}>
                Record Payment
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <DetailField label="Invoice Number" type="string" mono value={invoice.invoiceNumber} />
                  <DetailField
                    label="Type"
                    type="string"
                    value={
                      <Badge variant="secondary" className={typeBadge.className}>
                        {typeBadge.label}
                      </Badge>
                    }
                  />
                  <DetailField label="Party" type="string" value={invoice.partyName} />
                  <DetailField label="Party Type" type="string" value={invoice.partyType} />
                  <DetailField label="Issued Date" type="date" value={invoice.issuedDate} />
                  <DetailField label="Due Date" type="date" value={invoice.dueDate} />
                  <DetailField label="Payment Terms" type="string" value={invoice.paymentTerms} />
                  <DetailField
                    label="Status"
                    type="string"
                    value={
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {statusBadge.label}
                      </Badge>
                    }
                  />

                  <div className="col-span-2 mt-2 border-t pt-6">
                    <h4 className="mb-4 font-medium">Amounts</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <DetailField label="Subtotal" type="number" value={invoice.subtotal} />
                      <DetailField label="Tax" type="number" value={invoice.taxAmount} />
                      <DetailField label="Discount" type="number" value={invoice.discountAmount} />
                      <DetailField
                        label="Total"
                        type="string"
                        mono
                        value={<span className="text-lg font-medium">{invoice.totalAmount.toFixed(2)}</span>}
                      />
                      <DetailField
                        label="Paid"
                        type="string"
                        mono
                        value={<span className="text-success">{invoice.paidAmount.toFixed(2)}</span>}
                      />
                      <DetailField
                        label="Balance"
                        type="string"
                        mono
                        value={<span className="font-medium text-destructive">{invoice.balance.toFixed(2)}</span>}
                      />
                    </div>
                  </div>

                  {invoice.notes && (
                    <DetailField label="Notes" type="string" value={invoice.notes} className="col-span-2" />
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'items',
            label: `Line Items (${invoice.items.length})`,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent>
                  {invoice.items.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">No line items on this invoice.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">#</th>
                            <th className="pb-2 font-medium">Description</th>
                            <th className="pb-2 font-medium text-right">Qty</th>
                            <th className="pb-2 font-medium text-right">Unit Price</th>
                            <th className="pb-2 font-medium text-right">Tax</th>
                            <th className="pb-2 font-medium text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, index) => (
                            <tr key={item.id} className="border-b last:border-0">
                              <td className="py-3 text-muted-foreground">{index + 1}</td>
                              <td className="py-3 font-medium">{item.description}</td>
                              <td className="py-3 text-right font-mono">{item.quantity}</td>
                              <td className="py-3 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono">{item.taxAmount.toFixed(2)}</td>
                              <td className="py-3 text-right font-mono">{item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'payments',
            label: `Payments (${payments?.length ?? 0})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Payments</CardTitle>
                  {canRecordPayment && (
                    <Button size="sm" onClick={paymentDialog.open}>
                      <CreditCard className="mr-2 size-4" />
                      Record Payment
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                    </div>
                  ) : !payments || payments.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No payments recorded yet.{canRecordPayment ? ' Click "Record Payment" to add one.' : ''}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">Date</th>
                            <th className="pb-2 font-medium">Method</th>
                            <th className="pb-2 font-medium">Reference</th>
                            <th className="pb-2 font-medium text-right">Amount</th>
                            <th className="pb-2 font-medium">Status</th>
                            <th className="pb-2 font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className="border-b last:border-0">
                              <td className="py-3">
                                <FormattedDate value={payment.paidAt} dateFormat="P" />
                              </td>
                              <td className="py-3">
                                <Badge variant="outline">{payment.method}</Badge>
                              </td>
                              <td className="py-3 font-mono text-muted-foreground">{payment.reference ?? '—'}</td>
                              <td className="py-3 text-right font-mono font-medium">{payment.amount.toFixed(2)}</td>
                              <td className="py-3">
                                <Badge variant="secondary" className="bg-success/15 text-success">
                                  {payment.status}
                                </Badge>
                              </td>
                              <td className="py-3 text-muted-foreground">{payment.notes ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
        ]}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      <Dialog
        handle={paymentDialog}
        title="Record Payment"
        description="Record a payment against this invoice."
        content={(close) => (
          <RecordPaymentDialog invoiceId={invoice.id} balance={invoice.balance} onSuccess={close} onCancel={close} />
        )}
      />
    </div>
  );
};
