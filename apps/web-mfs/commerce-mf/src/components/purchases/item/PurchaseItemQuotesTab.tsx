import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm, useFormatters } from '@vritti/quantum-ui/hooks';
import { Typography } from '@vritti/quantum-ui/Typography';
import { CheckCheck, ExternalLink, FileText } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { PurchaseDetail, PurchaseItemQuoteRow, PurchaseItemView } from '@/schemas/purchases';
import { workspaceBase } from '@/utils/workspace';
import type { PurchasesBinding } from '../bindings';

interface PurchaseItemQuotesTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: PurchaseItemView;
  canAllocate: boolean;
  allocateTip: string;
}

// The quotation lines quoting the item a page at a time, in the supplier's unit and per primary unit, the cheapest
// posted one valid today marked per currency; a posted line is taken as an allocation of what is still unallocated
export const PurchaseItemQuotesTab: React.FC<PurchaseItemQuotesTabProps> = ({
  binding,
  purchase,
  item,
  canAllocate,
  allocateTip,
}) => {
  const { permissions, quotations } = binding;
  const fmt = useFormatters();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const quotesQuery = binding.usePurchaseItemQuotesTable(purchase.id, item.id);
  const allocateMutation = binding.useAddAllocationsFromQuotation();
  const isFullyAllocated = item.allocatedPrimaryQty >= item.primaryQty;

  // Confirms and allocates what is still unallocated of the item to the quote's supplier, at its unit and price
  const handleUse = useCallback(
    async (quote: PurchaseItemQuoteRow) => {
      const confirmed = await confirm({
        title: `Use ${quote.quotationNumber}?`,
        description: `What is still unallocated of ${item.inventoryItemName} is allocated to ${quote.supplierName}, at the quoted unit and price.`,
        confirmLabel: 'Use Quote',
      });
      if (confirmed) allocateMutation.mutate({ id: purchase.id, supplierQuotationItemIds: [quote.line.id] });
    },
    [confirm, allocateMutation, purchase.id, item.inventoryItemName],
  );

  const columns = useMemo<ColumnDef<PurchaseItemQuoteRow>[]>(
    () => [
      { accessorKey: 'supplierName', header: 'Supplier', meta: { grow: true } },
      {
        accessorKey: 'quotationNumber',
        header: 'Quotation',
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <StringCell value={row.original.quotationNumber} mono />
            {row.original.isPosted ? (
              <Badge variant="success">Posted</Badge>
            ) : (
              <Badge variant="outline">{quotations.draftLabel}</Badge>
            )}
          </div>
        ),
      },
      {
        id: 'quoted',
        header: 'Quoted',
        cell: ({ row }) =>
          row.original.isPosted ? (
            <span className="font-mono">{`${fmt.currency(row.original.line.unitPrice).primary} / ${row.original.line.uomSymbol}`}</span>
          ) : (
            <Typography variant="caption" intent="muted">
              Waiting for prices
            </Typography>
          ),
      },
      {
        id: 'perPrimary',
        header: `Per ${item.primaryUomSymbol}`.trim(),
        cell: ({ row }) =>
          row.original.isPosted ? (
            <span className="inline-flex items-center gap-1.5">
              <Typography variant="body2" intent={row.original.isLowest ? 'success' : 'default'} className="font-mono">
                {fmt.currency(row.original.line.unitPricePerPrimary).primary}
              </Typography>
              {row.original.isLowest && <Badge variant="success">Lowest</Badge>}
            </span>
          ) : null,
      },
      {
        id: 'scheme',
        header: 'Scheme',
        cell: ({ row }) =>
          row.original.line.schemeBuyQty !== null && row.original.line.schemeFreeQty !== null ? (
            <span className="font-mono">{`${fmt.number(row.original.line.schemeBuyQty).primary} + ${fmt.number(row.original.line.schemeFreeQty).primary}`}</span>
          ) : (
            <Typography variant="caption" intent="muted">
              —
            </Typography>
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
          const quote = row.original;
          return (
            <RowActions
              actions={[
                {
                  id: 'use',
                  icon: CheckCheck,
                  label: 'Use Quote',
                  permission: permissions.edit,
                  disabled: !canAllocate || !quote.isPosted || isFullyAllocated,
                  disabledTip: !canAllocate
                    ? allocateTip
                    : quote.isPosted
                      ? 'The whole quantity is allocated.'
                      : 'Waiting for the quotation to be priced and posted.',
                  onClick: () => handleUse(quote),
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
                        supplierId: quote.supplierId,
                        supplierName: quote.supplierName,
                        quotationId: quote.quotationId,
                        quotationNumber: quote.quotationNumber,
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
      item.primaryUomSymbol,
      permissions.edit,
      canAllocate,
      allocateTip,
      isFullyAllocated,
      handleUse,
      navigate,
      pathname,
    ],
  );

  const quotesTable = useDataTable({
    columns,
    slug: binding.purchaseItemTableSlug(purchase.id, item.id, 'quotes'),
    label: 'quote',
    query: quotesQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () =>
      queryClient.invalidateQueries({ queryKey: binding.purchaseItemTableKeys.quotes(purchase.id, item.id) }),
  });

  return (
    <DataTable
      table={quotesTable}
      mode="tab"
      permission={permissions.quotations.view}
      searchConfig={{ columns: [{ id: 'quotationNumber', label: 'Quotation Number' }], searchAll: true }}
      filters={[<binding.SupplierFilter key="supplierId" />]}
      emptyStateConfig={{
        icon: FileText,
        title: 'Not quoted',
        description: "Request quotations from the purchase's Quotations tab; their lines for this item show here.",
      }}
    />
  );
};
