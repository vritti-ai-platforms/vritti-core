import { useQueryClient } from '@tanstack/react-query';
import { SITE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SITE_SUPPLIER_ITEMS_TABLE_KEY, useSiteSupplierItemsTable } from '@/hooks/site/suppliers';
import type { SupplierItemData } from '@/schemas/suppliers';

interface ItemsTabProps {
  supplierId: string;
}

export const ItemsTab: React.FC<ItemsTabProps> = ({ supplierId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useSiteSupplierItemsTable(supplierId);

  const columns = useMemo<ColumnDef<SupplierItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => (
          <Link
            to={`items/${buildSlug(row.original.inventoryItemName, row.original.id)}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.inventoryItemName}
          </Link>
        ),
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
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) => (row.original.isPreferred ? <Badge variant="success">Yes</Badge> : '—'),
      },
    ],
    [],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-site-supplier-${supplierId}-items`,
    label: 'item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SITE_SUPPLIER_ITEMS_TABLE_KEY(supplierId) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={SITE_SUPPLIERS.items.view}
      emptyStateConfig={{
        icon: ClipboardList,
        title: 'No items',
        description: 'This supplier has no linked items available to your site yet.',
      }}
    />
  );
};
