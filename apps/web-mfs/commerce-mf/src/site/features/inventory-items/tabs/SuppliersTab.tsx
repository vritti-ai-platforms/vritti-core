import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Truck } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { InventoryItemSupplierData } from '@/schemas/suppliers';
import { INVENTORY_ITEM_SUPPLIERS_TABLE_KEY, useInventoryItemSuppliersTable } from '@/site/hooks/inventory-items';

interface SuppliersTabProps {
  inventoryItemId: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemSuppliersTable(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemSupplierData>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">{row.original.supplierName ?? '—'}</span>
            <span className="text-xs text-muted-foreground">{row.original.supplierCode ?? ''}</span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) =>
          row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time',
        cell: ({ row }) => (row.original.leadTimeDays != null ? `${row.original.leadTimeDays} d` : '—'),
      },
      {
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) =>
          row.original.isPreferred ? (
            <Badge variant="secondary" className="bg-success/15 text-success">
              Yes
            </Badge>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'isActive',
        header: 'Active',
        cell: ({ row }) =>
          row.original.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>,
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-inventory-item-${inventoryItemId}-suppliers`,
    label: 'supplier',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_SUPPLIERS_TABLE_KEY(inventoryItemId) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      searchConfig={{
        columns: [
          { id: 'supplierName', label: 'Supplier name' },
          { id: 'supplierCode', label: 'Supplier code' },
          { id: 'supplierItemCode', label: 'Supplier item code' },
        ],
        searchAll: true,
      }}
      filters={[
        <SelectFilter
          key="isPreferred"
          name="isPreferred"
          label="Preferred"
          options={[
            { label: 'Preferred', value: 'true' },
            { label: 'Not preferred', value: 'false' },
          ]}
        />,
        <SelectFilter
          key="isActive"
          name="isActive"
          label="Active"
          options={[
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]}
        />,
      ]}
      emptyStateConfig={{
        icon: Truck,
        title: 'No suppliers',
        description: 'No suppliers carry this item yet. Link this item from a supplier detail page to get started.',
      }}
    />
  );
};
