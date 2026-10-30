import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { type ColumnDef, DataTable, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { supplierPriceColumns } from '@/components/suppliers/priceColumns';
import { INVENTORY_ITEM_PRICES_TABLE_KEY, useInventoryItemPricesTable } from '@/hooks/site/inventory-items';
import type { ItemSupplierPriceRow } from '@/schemas/suppliers';

interface PricesTabProps {
  inventoryItemId: string;
}

// Every supplier's validity-dated prices for the item at this site, each per the unit the supplier quotes in
export const PricesTab: React.FC<PricesTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useInventoryItemPricesTable(inventoryItemId);
  const showMrp = usePermission(SITE_INVENTORY_ITEMS.mrp.view).available;

  const columns = useMemo<ColumnDef<ItemSupplierPriceRow>[]>(
    () => [
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => <StringCell value={row.original.supplierName} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'Per',
        cell: ({ row }) => row.original.uomSymbol ?? '—',
      },
      ...supplierPriceColumns<ItemSupplierPriceRow>({ showMrp, showSite: false }),
    ],
    [showMrp],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-site-inventory-item-${inventoryItemId}-prices`,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={SITE_INVENTORY_ITEMS.prices.view}
      searchConfig={{ columns: [{ id: 'supplierName', label: 'Supplier name' }], searchAll: true }}
      emptyStateConfig={{
        icon: CalendarClock,
        title: 'No prices',
        description: 'No supplier has priced this item at this site. Prices come from quotations or a supplier item.',
      }}
    />
  );
};
