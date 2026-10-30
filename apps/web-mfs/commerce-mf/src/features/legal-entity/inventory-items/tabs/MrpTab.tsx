import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { type ColumnDef, CurrencyCell, DataTable, DateTimeCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Tag } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useInventoryItemMrp } from '@/hooks/legal-entity/inventory-items';
import type { InventoryItemMrpData } from '@/schemas/inventory-item-mrp';

interface MrpTabProps {
  inventoryItemId: string;
}

// The item's MRPs, read-only — the organization maintains them; quotations and goods receipts record new ones
export const MrpTab: React.FC<MrpTabProps> = ({ inventoryItemId }) => {
  const { data: rows = [], isLoading } = useInventoryItemMrp(inventoryItemId);

  const columns = useMemo<ColumnDef<InventoryItemMrpData>[]>(
    () => [
      { accessorKey: 'uomSymbol', header: 'Unit', cell: ({ row }) => row.original.uomSymbol ?? '—' },
      { accessorKey: 'amount', header: 'Currency', cell: ({ row }) => row.original.amount.currency },
      { id: 'value', header: 'MRP', cell: ({ row }) => <CurrencyCell value={row.original.amount} /> },
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

  const serverState = useMemo(() => ({ result: rows, count: rows.length }), [rows]);

  const { table } = useDataTable({
    columns,
    serverState,
    slug: `commerce-le-inventory-item-${inventoryItemId}-mrp`,
    label: 'MRP',
    enableRowSelection: false,
    enableSorting: false,
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={LE_INVENTORY_ITEMS.mrp.view}
      emptyStateConfig={{
        icon: Tag,
        title: 'No MRP recorded',
        description: 'MRPs are maintained by the organization and recorded from quotations and goods receipts.',
      }}
    />
  );
};
