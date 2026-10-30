import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  DataTable,
  type DataTableEmptyConfig,
  type RowAction,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { Package } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { type InventoryItemData, inventoryItemTypeConfig, inventoryTrackingConfig } from '@/schemas/inventory-items';
import { CategoryFilter } from '@/selectors/category';
import { UomFilter } from '@/selectors/uom';

interface InventoryItemsTableProps<TRow extends InventoryItemData> {
  response: TableResponse<TRow> | undefined;
  isLoading: boolean;
  slug: string;
  tableKey: readonly unknown[];
  permission: string;
  extraColumns?: ColumnDef<TRow>[];
  extraFilters?: React.ReactNode[];
  rowActions?: (row: TRow) => RowAction[];
  toolbarActions?: React.ReactNode;
  emptyStateConfig?: DataTableEmptyConfig;
}

const NO_COLUMNS: never[] = [];
const NO_FILTERS: React.ReactNode[] = [];

// The master-item table every workspace shows; each scope adds its own columns, actions and toolbar
export const InventoryItemsTable = <TRow extends InventoryItemData>({
  response,
  isLoading,
  slug,
  tableKey,
  permission,
  extraColumns = NO_COLUMNS,
  extraFilters = NO_FILTERS,
  rowActions,
  toolbarActions,
  emptyStateConfig,
}: InventoryItemsTableProps<TRow>) => {
  const queryClient = useQueryClient();

  const columns = useMemo<ColumnDef<TRow>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: ({ row }) => <StringCell value={row.original.sku} mono />,
        enableSorting: true,
      },
      { accessorKey: 'name', header: 'Name', enableSorting: true },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => <StringCell value={row.original.categoryName} />,
        enableSorting: false,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const config = inventoryItemTypeConfig[row.original.type];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'tracking',
        header: 'Tracking',
        enableSorting: true,
        cell: ({ row }) => inventoryTrackingConfig[row.original.tracking].label,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'Unit',
        cell: ({ row }) => <StringCell value={row.original.uomSymbol} />,
        enableSorting: false,
      },
      {
        accessorKey: 'taxClassName',
        header: 'Tax Class',
        cell: ({ row }) => <StringCell value={row.original.taxClassName} />,
        enableSorting: false,
      },
      ...extraColumns,
      ...(rowActions
        ? [
            {
              id: 'actions',
              header: '',
              cell: ({ row }: { row: { original: TRow } }) => <RowActions actions={rowActions(row.original)} />,
              enableSorting: false,
              enableHiding: false,
            },
          ]
        : []),
    ],
    [extraColumns, rowActions],
  );

  const { table } = useDataTable({
    columns,
    slug,
    label: 'inventory item',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: tableKey }),
  });

  return (
    <DataTable
      table={table}
      isLoading={isLoading}
      permission={permission}
      searchConfig={{
        columns: [
          { id: 'name', label: 'Name' },
          { id: 'sku', label: 'SKU' },
        ],
        searchAll: true,
      }}
      filters={[
        ...extraFilters,
        <SelectFilter
          key="type"
          name="type"
          label="Type"
          multiple
          options={Object.entries(inventoryItemTypeConfig).map(([value, { label }]) => ({ label, value }))}
        />,
        <SelectFilter
          key="tracking"
          name="tracking"
          label="Tracking"
          multiple
          options={Object.entries(inventoryTrackingConfig).map(([value, { label }]) => ({ label, value }))}
        />,
        <CategoryFilter key="categoryId" multiple />,
        <UomFilter key="uomId" multiple />,
      ]}
      toolbarActions={toolbarActions ? { actions: toolbarActions } : undefined}
      emptyStateConfig={
        emptyStateConfig ?? {
          icon: Package,
          title: 'No inventory items',
          description: 'The organization has not defined any inventory items yet.',
        }
      }
    />
  );
};
