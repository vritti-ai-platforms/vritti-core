import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { FileText, Plus, Scale } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { PurchaseActionValues, type PurchaseHeader } from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';
import { PurchaseCoverage } from '../../PurchaseCoverage';
import { itemCoveragePercent } from '../../purchaseState';
import { AddAllocationDialog } from './forms/AddAllocationDialog';
import { ApplyQuotationDialog } from './forms/ApplyQuotationDialog';
import { SourcingAllocations } from './SourcingAllocations';
import { SourcingQuotes } from './SourcingQuotes';
import { buildSourcingRows, type SourcingRow } from './sourcingRows';

interface SourcingItemsTabProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  readOnly: boolean;
}

// Who supplies each item: its quotes side by side, the allocations sourcing it and how much of it they cover;
// allocations are added, edited and taken from a quotation while sourcing is open
export const SourcingItemsTab: React.FC<SourcingItemsTabProps> = ({ binding, purchase, readOnly }) => {
  const { permissions } = binding;
  const fmt = useFormatters();
  const applyDialog = useDialog();
  const { data: items } = binding.usePurchaseSourcingItems(purchase.id);
  const { data: quotations } = binding.usePurchaseQuotations(purchase.id);
  const canAllocate = !readOnly && purchase.availableActions.includes(PurchaseActionValues.EDIT_ALLOCATIONS);
  const rows = useMemo(() => buildSourcingRows(items, quotations), [items, quotations]);
  const hasPostedQuotation = quotations.some((quotation) => quotation.isPosted);

  const columns = useMemo<ColumnDef<SourcingRow>[]>(
    () => [
      {
        id: 'item',
        header: 'Item',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.item.inventoryItemName}</span>
            <span className="text-xs text-muted-foreground">{row.original.item.primaryUomSymbol}</span>
          </div>
        ),
      },
      {
        id: 'need',
        header: 'Need',
        cell: ({ row }) => <span className="font-mono">{fmt.number(row.original.item.primaryQty).primary}</span>,
      },
      ...(hasPostedQuotation
        ? [
            {
              id: 'quotes',
              header: 'Quotes (per primary unit)',
              cell: ({ row }) => (
                <SourcingQuotes
                  binding={binding}
                  purchase={purchase}
                  quotes={row.original.quotes}
                  canAllocate={canAllocate}
                />
              ),
            } satisfies ColumnDef<SourcingRow>,
          ]
        : []),
      {
        id: 'allocations',
        header: 'Allocations',
        meta: { grow: true },
        cell: ({ row }) => (
          <SourcingAllocations binding={binding} purchase={purchase} item={row.original.item} readOnly={readOnly} />
        ),
      },
      {
        id: 'coverage',
        header: 'Coverage',
        cell: ({ row }) => (
          <PurchaseCoverage
            percent={itemCoveragePercent(row.original.item)}
            caption={`${fmt.number(row.original.item.allocatedPrimaryQty).primary} of ${fmt.number(row.original.item.primaryQty).primary} allocated`}
            align="center"
          />
        ),
      },
      ...(canAllocate
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => (
                <RowActions
                  actions={[
                    {
                      id: 'allocate',
                      icon: Plus,
                      label: 'Allocate',
                      permission: permissions.edit,
                      dialog: {
                        title: 'Allocate to Supplier',
                        description: `Source part of ${row.original.item.inventoryItemName} from a supplier enrolled at the site.`,
                        className: 'max-w-2xl',
                        content: (close) => (
                          <AddAllocationDialog
                            binding={binding}
                            purchase={purchase}
                            item={row.original.item}
                            onSuccess={close}
                            onCancel={close}
                          />
                        ),
                      },
                    },
                  ]}
                />
              ),
            } satisfies ColumnDef<SourcingRow>,
          ]
        : []),
    ],
    [binding, purchase, permissions.edit, canAllocate, readOnly, hasPostedQuotation, fmt],
  );

  const sourcingTable = useDataTable({
    columns,
    query: { data: { result: rows, count: rows.length } },
    slug: 'commerce-purchase-sourcing',
    label: 'item',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        table={sourcingTable}
        mode="stepperTab"
        permission={permissions.view}
        toolbarActions={
          canAllocate && hasPostedQuotation
            ? {
                actions: (
                  <Button
                    size="sm"
                    variant="outline"
                    permission={permissions.edit}
                    startAdornment={<FileText className="size-4" />}
                    onClick={applyDialog.open}
                  >
                    Use Quotation
                  </Button>
                ),
              }
            : undefined
        }
        emptyStateConfig={{
          icon: Scale,
          title: 'Nothing to source',
          description: 'The purchase has no items.',
        }}
      />
      {canAllocate && (
        <Dialog
          handle={applyDialog}
          icon={FileText}
          title="Use Quotation"
          description="Allocate every item the quotation prices to its supplier, at the quoted unit and price."
          content={(close) => (
            <ApplyQuotationDialog
              binding={binding}
              purchase={purchase}
              items={items}
              quotations={quotations}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}
    </div>
  );
};
