import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { CheckCheck, ExternalLink, FileText } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  PurchaseActionValues,
  type PurchaseDetail,
  type PurchaseQuotation,
  purchaseStatusConfig,
} from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../../bindings';
import { RequestQuotationDialog } from '../../forms/RequestQuotationDialog';

interface PurchaseQuotationsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
}

// The quotations requested for the purchase a page at a time — drafts until priced and posted — each opening in the
// supplier's Quotations, and a posted one allocating what is still unallocated of the items it prices; a purchase that
// requires quotations requests them here
export const PurchaseQuotationsTab: React.FC<PurchaseQuotationsTabProps> = ({ binding, purchase }) => {
  const { permissions, quotations } = binding;
  const fmt = useFormatters();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const quotationsQuery = binding.usePurchaseQuotationsTable(purchase.id);
  const allocateMutation = binding.useAddAllocationsFromQuotation();
  const { data: actions } = binding.usePurchaseActions(purchase.id);
  const canAllocate = actions?.availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS) ?? false;
  const canRequest = actions?.availableActions.includes(PurchaseActionValues.REQUEST_QUOTATION) ?? false;
  const closedTip = `The purchase is ${purchaseStatusConfig[purchase.status].label.toLowerCase()}.`;
  const requestDialog = useDialog();

  const columns = useMemo<ColumnDef<PurchaseQuotation>[]>(
    () => [
      {
        accessorKey: 'quotationNumber',
        header: 'Quotation',
        enableSorting: true,
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
        enableSorting: true,
        cell: ({ row }) =>
          row.original.validTo
            ? `${fmt.date(row.original.validFrom).primary} – ${fmt.date(row.original.validTo).primary}`
            : `From ${fmt.date(row.original.validFrom).primary}`,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const quotation = row.original;
          return (
            <RowActions
              actions={[
                {
                  id: 'use',
                  icon: CheckCheck,
                  label: 'Use Quotation',
                  permission: permissions.edit,
                  disabled: !canAllocate || !quotation.isPosted,
                  disabledTip: canAllocate ? 'Waiting for the quotation to be priced and posted.' : closedTip,
                  confirm: {
                    title: `Use ${quotation.quotationNumber}?`,
                    description: `What is still unallocated of the items it prices is allocated to ${quotation.supplierName}, at the quoted unit and price.`,
                    confirmLabel: 'Use Quotation',
                  },
                  onClick: () => allocateMutation.mutate({ id: purchase.id, supplierQuotationId: quotation.id }),
                },
                {
                  id: 'open',
                  icon: ExternalLink,
                  label: 'Open in Quotations',
                  hidden: !quotations.quotationPath,
                  onClick: () =>
                    quotations.quotationPath &&
                    navigate(
                      `${workspaceBase(pathname)}/${quotations.quotationPath({
                        supplierId: quotation.supplierId,
                        supplierName: quotation.supplierName,
                        quotationId: quotation.id,
                        quotationNumber: quotation.quotationNumber,
                      })}`,
                    ),
                },
              ]}
            />
          );
        },
      },
    ],
    [
      fmt,
      quotations,
      permissions.edit,
      canAllocate,
      closedTip,
      navigate,
      pathname,
      allocateMutation.mutate,
      purchase.id,
    ],
  );

  const quotationsTable = useDataTable({
    columns,
    slug: binding.purchaseTableSlug(purchase.id, 'quotations'),
    label: 'quotation',
    query: quotationsQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.purchaseTableKeys.quotations(purchase.id) }),
  });

  const requestAction = (
    <Button
      size="sm"
      permission={permissions.quotations.add}
      startAdornment={<FileText className="size-4" />}
      onClick={requestDialog.open}
      disabled={!canRequest}
      disabledTip={purchase.quotationsRequired ? closedTip : 'The purchase does not require quotations.'}
    >
      Request Quotation
    </Button>
  );

  return (
    <>
      <DataTable
        table={quotationsTable}
        mode="tab"
        permission={permissions.quotations.view}
        searchConfig={{ columns: [{ id: 'quotationNumber', label: 'Quotation Number' }], searchAll: true }}
        filters={[<binding.SupplierFilter key="supplierId" />]}
        toolbarActions={{ actions: requestAction }}
        emptyStateConfig={{
          icon: FileText,
          title: 'No quotations',
          description: 'Request a quotation from a supplier; it is priced and posted under the supplier.',
          action: requestAction,
        }}
      />
      <Dialog
        handle={requestDialog}
        icon={FileText}
        title="Request Quotation"
        description="Creates a draft quotation with a line for each item still to allocate that the supplier supplies at the site."
        content={(close) => (
          <RequestQuotationDialog
            binding={binding}
            purchase={purchase}
            onSuccess={(quotation) => {
              close();
              if (quotations.quotationPath)
                navigate(`${workspaceBase(pathname)}/${quotations.quotationPath(quotation)}`);
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
