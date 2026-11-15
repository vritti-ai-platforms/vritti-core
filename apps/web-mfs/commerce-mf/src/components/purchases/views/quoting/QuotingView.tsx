import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Typography } from '@vritti/quantum-ui/Typography';
import { CheckCheck, ExternalLink, FileText, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PurchaseActionValues,
  type PurchaseHeader,
  type PurchaseQuotation,
  PurchaseStatusValues,
  PurchaseStepValues,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../../bindings';
import { quotedSupplierIds } from '../../purchaseState';
import type { PurchaseQuotationLink } from '../../types';
import { RequestQuotationDialog } from './forms/RequestQuotationDialog';

interface QuotingViewProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// The Quoting stage: the quotations linked to the purchase — requested here as drafts, priced and posted by the legal
// entity — completed once enough suppliers have posted one
export const QuotingView: React.FC<QuotingViewProps> = ({ binding, purchase, readOnly }) => {
  const { permissions, quotations } = binding;
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const requestDialog = useDialog();
  const { data: linkedQuotations } = binding.usePurchaseQuotations(purchase.id);
  const canRequest = !readOnly && purchase.availableActions.includes(PurchaseActionValues.REQUEST_QUOTATION);
  const quotedCount = quotedSupplierIds(linkedQuotations).length;

  const openQuotation = useCallback(
    (quotation: PurchaseQuotationLink) => {
      if (quotations.quotationPath) navigate(`${workspaceBase(pathname)}/${quotations.quotationPath(quotation)}`);
    },
    [navigate, pathname, quotations],
  );

  const columns = useMemo<ColumnDef<PurchaseQuotation>[]>(
    () => [
      {
        accessorKey: 'quotationNumber',
        header: 'Quotation',
        cell: ({ row }) => <StringCell value={row.original.quotationNumber} mono />,
      },
      { accessorKey: 'supplierName', header: 'Supplier', meta: { grow: true } },
      {
        accessorKey: 'ownerName',
        header: 'Owner',
        cell: ({ row }) => <Badge variant="secondary">{row.original.ownerName}</Badge>,
      },
      {
        accessorKey: 'isPosted',
        header: 'Status',
        cell: ({ row }) =>
          row.original.isPosted ? (
            <Badge variant="success">Posted</Badge>
          ) : (
            <Badge variant="outline">{quotations.draftLabel}</Badge>
          ),
      },
      {
        accessorKey: 'pricedItemCount',
        header: 'Lines Priced',
        cell: ({ row }) => (
          <span className="font-mono">
            {`${fmt.number(row.original.pricedItemCount).primary} / ${fmt.number(row.original.itemCount).primary}`}
          </span>
        ),
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid',
        cell: ({ row }) =>
          row.original.validTo
            ? `${fmt.date(row.original.validFrom).primary} – ${fmt.date(row.original.validTo).primary}`
            : `From ${fmt.date(row.original.validFrom).primary}`,
      },
      ...(quotations.quotationPath
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <RowActions
                  actions={[
                    {
                      id: 'open',
                      icon: ExternalLink,
                      label: 'Open in Quotations',
                      onClick: () =>
                        openQuotation({
                          supplierId: row.original.supplierId,
                          supplierName: row.original.supplierName,
                          quotationId: row.original.id,
                          quotationNumber: row.original.quotationNumber,
                        }),
                    },
                  ]}
                />
              ),
            } satisfies ColumnDef<PurchaseQuotation>,
          ]
        : []),
    ],
    [fmt, quotations, openQuotation],
  );

  const quotationsTable = useDataTable({
    columns,
    query: { data: { result: linkedQuotations, count: linkedQuotations.length } },
    slug: 'commerce-purchase-quotations',
    label: 'quotation',
    enableRowSelection: false,
    enableSorting: false,
  });

  const isQuoting = !readOnly && purchase.step === PurchaseStepValues.QUOTING;
  const lockedTip =
    purchase.status !== PurchaseStatusValues.OPEN
      ? `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`
      : `The quotations were completed; the purchase is in ${purchaseStepConfig[purchase.step].label}.`;

  const requestAction = (
    <Button
      size="sm"
      permission={permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={requestDialog.open}
      disabled={!canRequest}
      disabledTip={lockedTip}
    >
      Request Quotation
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant={quotedCount >= purchase.minQuotations ? 'success' : 'warning'}>
          {`${quotedCount} of ${purchase.minQuotations} ${pluralize('supplier', purchase.minQuotations)} posted`}
        </Badge>
        <Typography variant="body2" intent="muted">
          {readOnly || quotedCount >= purchase.minQuotations
            ? 'Sourcing allocates from the posted quotation lines.'
            : `Complete Quotations unlocks at ${pluralize('posted supplier', purchase.minQuotations, true)}; Sourcing then allocates from the quoted lines.`}
        </Typography>
      </div>
      <DataTable
        table={quotationsTable}
        mode="stepper"
        permission={permissions.view}
        toolbarActions={{
          actions: (
            <div className="flex items-center gap-2">
              {requestAction}
              <CompleteQuotationsButton
                binding={binding}
                purchase={purchase}
                quotedCount={quotedCount}
                canComplete={isQuoting}
                lockedTip={lockedTip}
              />
            </div>
          ),
        }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No quotations',
          description: readOnly
            ? 'No quotation was requested for this purchase.'
            : 'Request a quotation from a supplier; the legal entity prices and posts it.',
          action: requestAction,
        }}
      />
      {canRequest && (
        <Dialog
          handle={requestDialog}
          icon={FileText}
          title="Request Quotation"
          description="Creates a draft quotation with one line per item of the purchase."
          content={(close) => (
            <RequestQuotationDialog
              binding={binding}
              purchase={purchase}
              onSuccess={(quotation) => {
                close();
                openQuotation(quotation);
              }}
              onCancel={close}
            />
          )}
        />
      )}
    </div>
  );
};

interface CompleteQuotationsButtonProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  quotedCount: number;
  // Whether the purchase is open in Quoting, so its quotations can still be completed
  canComplete: boolean;
  // Why they can't any more, shown on the disabled button
  lockedTip: string;
}

// Completes the quotations once enough suppliers have posted one, moving the purchase on to sourcing
const CompleteQuotationsButton: React.FC<CompleteQuotationsButtonProps> = ({
  binding,
  purchase,
  quotedCount,
  canComplete,
  lockedTip,
}) => {
  const confirm = useConfirm();
  const completeMutation = binding.useCompleteQuotations();

  // Confirms and completes the quotations; drafts still open are no longer awaited
  const handleComplete = async () => {
    const confirmed = await confirm({
      title: 'Complete quotations?',
      description: `${pluralize('supplier', quotedCount, true)} quoted. The purchase moves on to Sourcing, where items are allocated from the posted quotations.`,
      confirmLabel: 'Complete Quotations',
    });
    if (confirmed) completeMutation.mutate(purchase.id);
  };

  return (
    <Button
      size="sm"
      permission={binding.permissions.edit}
      startAdornment={<CheckCheck className="size-4" />}
      onClick={handleComplete}
      isLoading={completeMutation.isPending}
      disabled={!canComplete || quotedCount < purchase.minQuotations}
      disabledTip={
        canComplete
          ? `Waiting for ${pluralize('supplier', purchase.minQuotations, true)} to post a quotation.`
          : lockedTip
      }
    >
      Complete Quotations
    </Button>
  );
};
