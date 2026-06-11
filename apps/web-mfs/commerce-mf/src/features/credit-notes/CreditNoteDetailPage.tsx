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
import { FileCheck, FileText } from 'lucide-react';
import { useState } from 'react';
import { useCreditNote } from '@/hooks/credit-notes';
import { ApplyCreditNoteDialog } from './forms/ApplyCreditNoteDialog';

const statusVariant = (status: string): { variant: 'secondary' | 'outline' | 'destructive'; className?: string } => {
  switch (status) {
    case 'ACTIVE':
      return { variant: 'secondary', className: 'bg-success/15 text-success' };
    case 'FULLY_APPLIED':
      return { variant: 'outline' };
    case 'VOID':
      return { variant: 'destructive' };
    default:
      return { variant: 'secondary' };
  }
};

export const CreditNoteDetailPage = () => {
  const { id } = useSlugParams('cnSlug');
  const { data: creditNote, isLoading } = useCreditNote(id ?? null);
  const [activeTab, setActiveTab] = useState('overview');
  const applyDialog = useDialog();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!creditNote) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Credit note not found.</div>;
  }

  const badge = statusVariant(creditNote.status);
  const canApply = BigInt(creditNote.remaining) > 0n && creditNote.status !== 'VOID';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={creditNote.creditNoteNumber}
        description={creditNote.partyName}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={creditNote.type === 'PAYABLE' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}
            >
              {creditNote.type === 'PAYABLE' ? 'Payable' : 'Receivable'}
            </Badge>
            <Badge variant={badge.variant} className={badge.className}>
              {creditNote.status}
            </Badge>
            {canApply && (
              <Button size="sm" startAdornment={<FileCheck className="size-4" />} onClick={applyDialog.open}>
                Apply to Invoice
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
                  <DetailField label="Credit Note Number" type="string" mono value={creditNote.creditNoteNumber} />
                  <DetailField label="Party" type="string" value={creditNote.partyName} />
                  <DetailField label="Party Type" type="string" value={creditNote.partyType} />
                  <DetailField
                    label="Status"
                    type="string"
                    value={
                      <Badge variant={badge.variant} className={badge.className}>
                        {creditNote.status}
                      </Badge>
                    }
                  />
                  <DetailField
                    label="Amount"
                    type="string"
                    mono
                    value={<span className="text-lg font-medium">{Number(creditNote.amount).toFixed(2)}</span>}
                  />
                  <DetailField label="Applied" type="number" value={creditNote.appliedAmount} />
                  <DetailField
                    label="Remaining"
                    type="string"
                    mono
                    value={<span className="font-medium text-success">{Number(creditNote.remaining).toFixed(2)}</span>}
                  />
                  <DetailField label="Issued By" type="string" value={creditNote.issuedBy} />
                  <DetailField label="Reason" type="string" value={creditNote.reason} className="col-span-2" />
                </CardContent>
              </Card>
            ),
          },
          {
            value: 'applications',
            label: `Applications (${creditNote.applications.length})`,
            content: (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>Applications</CardTitle>
                  {canApply && (
                    <Button size="sm" onClick={applyDialog.open}>
                      <FileCheck className="mr-2 size-4" />
                      Apply to Invoice
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {creditNote.applications.length === 0 ? (
                    <p className="py-4 text-center text-muted-foreground">
                      No applications yet.{canApply ? ' Click "Apply to Invoice" to apply this credit.' : ''}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 font-medium">Invoice ID</th>
                            <th className="pb-2 font-medium text-right">Amount</th>
                            <th className="pb-2 font-medium">Applied At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditNote.applications.map((app) => (
                            <tr key={app.id} className="border-b last:border-0">
                              <td className="py-3 font-mono">{app.invoiceId}</td>
                              <td className="py-3 text-right font-mono font-medium">{Number(app.amount).toFixed(2)}</td>
                              <td className="py-3">
                                <FormattedDate value={app.appliedAt} dateFormat="P" />
                              </td>
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
        handle={applyDialog}
        icon={FileText}
        title="Apply to Invoice"
        description="Apply this credit note against an outstanding invoice."
        content={(close) => (
          <ApplyCreditNoteDialog
            creditNoteId={creditNote.id}
            remaining={Number(creditNote.remaining)}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
