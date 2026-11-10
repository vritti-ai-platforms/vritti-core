import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { ListPlus } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { SupplierQuotationDetail, SupplierQuotationItemData } from '@/schemas/supplier-quotations';

interface QuotationItemsTableProps {
  quotation: SupplierQuotationDetail;
  queryKey: readonly unknown[];
  permission: string;
  // Who may see the MRP column
  mrpPermission: string;
  // Row actions on a line, where the quotation can be edited (LE)
  lineActions?: (item: SupplierQuotationItemData) => RowAction[];
  toolbarAction?: React.ReactNode;
  emptyDescription: string;
}

// A quotation's lines: the item, its unit, the quoted price, MRP, scheme and tax treatment
export const QuotationItemsTable: React.FC<QuotationItemsTableProps> = ({
  quotation,
  queryKey,
  permission,
  mrpPermission,
  lineActions,
  toolbarAction,
  emptyDescription,
}) => {
  const queryClient = useQueryClient();
  const fmt = useFormatters();
  const showMrp = usePermission(mrpPermission).available;

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
      ...(lineActions
        ? [
            {
              id: 'actions',
              header: '',
              enableHiding: false,
              cell: ({ row }) => <RowActions actions={lineActions(row.original)} />,
            } satisfies ColumnDef<SupplierQuotationItemData>,
          ]
        : []),
    ],
    [showMrp, lineActions, fmt],
  );

  const quotationItemsTable = useDataTable({
    columns,
    query: { data: { result: quotation.items, count: quotation.items.length } },
    slug: 'commerce-supplier-quotation-items',
    label: 'line',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey }),
  });

  return (
    <DataTable
      table={quotationItemsTable}
      mode="tab"
      permission={permission}
      toolbarActions={toolbarAction ? { actions: toolbarAction } : undefined}
      emptyStateConfig={{ icon: ListPlus, title: 'No lines yet', description: emptyDescription, action: toolbarAction }}
    />
  );
};
