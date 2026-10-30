import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useFormatters } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { ListPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { SUPPLIER_QUOTATION_KEY, useRemoveSupplierQuotationItem } from '@/hooks/legal-entity/supplier-quotations';
import type { SupplierQuotationDetail, SupplierQuotationItemData } from '@/schemas/supplier-quotations';
import { QuotationItemDialog } from '../forms/QuotationItemDialog';

interface ItemsTabProps {
  supplierId: string;
  currencyCode: string;
  quotation: SupplierQuotationDetail;
}

const LOCKED_TIP = 'Lines are fixed once the quotation is posted to a site';

export const ItemsTab = ({ supplierId, currencyCode, quotation }: ItemsTabProps) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const fmt = useFormatters();
  const addDialog = useDialog();
  const removeMutation = useRemoveSupplierQuotationItem(supplierId, quotation.id);
  const isDraft = quotation.status === 'DRAFT';
  const lockedTip = isDraft ? undefined : LOCKED_TIP;

  const handleRemove = useCallback(
    async (item: SupplierQuotationItemData) => {
      const ok = await confirm({
        title: `Remove "${item.inventoryItemName}"?`,
        description: 'The line is removed from the quotation.',
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (ok) removeMutation.mutate(item.id);
    },
    [confirm, removeMutation],
  );

  const showMrp = usePermission(LE_INVENTORY_ITEMS.mrp.view).available;
  const columns = useMemo<ColumnDef<SupplierQuotationItemData>[]>(
    () => [
      { accessorKey: 'inventoryItemName', header: 'Item' },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} mono />,
      },
      { accessorKey: 'uomSymbol', header: 'Unit', cell: ({ row }) => <StringCell value={row.original.uomSymbol} /> },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      ...(showMrp
        ? [
            {
              accessorKey: 'mrp',
              header: 'MRP',
              cell: ({ row }: { row: { original: SupplierQuotationItemData } }) => (
                <CurrencyCell value={row.original.mrp} />
              ),
            } satisfies ColumnDef<SupplierQuotationItemData>,
          ]
        : []),
      {
        id: 'scheme',
        header: 'Scheme',
        cell: ({ row }) =>
          row.original.schemeBuyQty != null && row.original.schemeFreeQty != null ? (
            <span className="font-mono">
              {fmt.number(row.original.schemeBuyQty).primary} + {fmt.number(row.original.schemeFreeQty).primary}
            </span>
          ) : (
            <StringCell value={null} />
          ),
      },
      {
        accessorKey: 'taxInclusive',
        header: 'Tax',
        cell: ({ row }) => <Badge variant="outline">{row.original.taxInclusive ? 'Inclusive' : 'Exclusive'}</Badge>,
      },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => {
          const item = row.original;
          const actions: RowAction[] = [
            {
              id: 'edit',
              icon: Pencil,
              label: 'Edit',
              permission: LE_SUPPLIERS.quotations.edit,
              disabled: !isDraft,
              disabledTip: lockedTip,
              dialog: {
                title: 'Edit Line',
                className: 'max-w-2xl',
                description: `Change the quoted terms for ${item.inventoryItemName}.`,
                content: (close) => (
                  <QuotationItemDialog
                    supplierId={supplierId}
                    quotationId={quotation.id}
                    currencyCode={currencyCode}
                    item={item}
                    onSuccess={close}
                    onCancel={close}
                  />
                ),
              },
            },
            {
              id: 'remove',
              icon: Trash2,
              label: 'Remove',
              variant: 'destructive',
              permission: LE_SUPPLIERS.quotations.edit,
              disabled: !isDraft,
              disabledTip: lockedTip,
              onClick: () => handleRemove(item),
            },
          ];
          return <RowActions actions={actions} />;
        },
      },
    ],
    [showMrp, supplierId, currencyCode, quotation.id, isDraft, lockedTip, handleRemove, fmt],
  );

  const { table } = useDataTable({
    columns,
    serverState: { result: quotation.items, count: quotation.items.length },
    slug: 'commerce-supplier-quotation-items',
    label: 'line',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_QUOTATION_KEY(supplierId, quotation.id) }),
  });

  const addButton = (
    <Button
      size="sm"
      permission={LE_SUPPLIERS.quotations.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addDialog.open}
      disabled={!isDraft}
      disabledTip={lockedTip}
    >
      Add Line
    </Button>
  );

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        permission={LE_SUPPLIERS.quotations.view}
        toolbarActions={{ actions: addButton }}
        emptyStateConfig={{
          icon: ListPlus,
          title: 'No lines yet',
          description: 'Add a line for each item the supplier quoted, with its price, MRP and scheme.',
          action: addButton,
        }}
      />
      <Dialog
        handle={addDialog}
        icon={ListPlus}
        title="Add Line"
        className="max-w-2xl"
        description="Quote one of the supplier's items."
        content={(close) => (
          <QuotationItemDialog
            supplierId={supplierId}
            quotationId={quotation.id}
            currencyCode={currencyCode}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
