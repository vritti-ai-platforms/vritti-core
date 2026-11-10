import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { type ColumnDef, CurrencyCell, DataTable, DateTimeCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Tag } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { LE_INVENTORY_ITEM_MRP_KEY, useInventoryItemMrpTable } from '@/hooks/legal-entity/inventory-items';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';

interface MrpTabProps {
  inventoryItemId: string;
}

// The item's MRPs, read-only — the organization maintains them; quotations and goods receipts record new ones
export const MrpTab: React.FC<MrpTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const inventoryItemMrpTableQuery = useInventoryItemMrpTable(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemMrpData>[]>(
    () => [
      { accessorKey: 'uomSymbol', header: 'Unit', cell: ({ row }) => row.original.uomSymbol ?? '—' },
      { id: 'currencyCode', accessorFn: (row) => row.amount.currency, header: 'Currency' },
      { accessorKey: 'amount', header: 'MRP', cell: ({ row }) => <CurrencyCell value={row.original.amount} /> },
      {
        accessorKey: 'sourcedAt',
        header: 'Sourced',
        cell: ({ row }) =>
          row.original.sourcedAt ? (
            <DateTimeCell value={row.original.sourcedAt} />
          ) : (
            <span className="text-xs text-muted-foreground">Manual</span>
          ),
      },
    ],
    [],
  );

  const inventoryItemMrpTable = useDataTable({
    columns,
    query: inventoryItemMrpTableQuery,
    slug: `commerce-le-inventory-item-${inventoryItemId}-mrp`,
    label: 'MRP',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: LE_INVENTORY_ITEM_MRP_KEY(inventoryItemId) }),
  });

  return (
    <DataTable
      table={inventoryItemMrpTable}
      mode="tab"
      permission={LE_INVENTORY_ITEMS.mrp.view}
      emptyStateConfig={{
        icon: Tag,
        title: 'No MRP recorded',
        description: 'MRPs are maintained by the organization and recorded from quotations and goods receipts.',
      }}
    />
  );
};
