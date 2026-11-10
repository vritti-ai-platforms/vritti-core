import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  DateTimeCell,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { CalendarClock } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { INVENTORY_ITEM_PRICES_TABLE_KEY, useInventoryItemPricesTable } from '@/hooks/site/inventory-items';
import { type ItemSupplierPriceRow, PRICE_SOURCE_LABELS } from '@/schemas/suppliers';

interface PricesTabProps {
  inventoryItemId: string;
}

// Every supplier's validity-dated prices for the item at this site, each per the unit the supplier quotes in
export const PricesTab: React.FC<PricesTabProps> = ({ inventoryItemId }) => {
  const queryClient = useQueryClient();
  const inventoryItemPricesTableQuery = useInventoryItemPricesTable(inventoryItemId);
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
              enableSorting: false,
              cell: ({ row }) => <CurrencyCell value={row.original.mrp} />,
            } satisfies ColumnDef<ItemSupplierPriceRow>,
          ]
        : []),
      {
        accessorKey: 'taxInclusive',
        header: 'Tax',
        enableSorting: false,
        cell: ({ row }) => <Badge variant="outline">{row.original.taxInclusive ? 'Inclusive' : 'Exclusive'}</Badge>,
      },
      {
        accessorKey: 'scheme',
        header: 'Scheme',
        enableSorting: false,
        cell: ({ row }) => {
          const { schemeBuyQty, schemeFreeQty } = row.original;
          return schemeBuyQty && schemeFreeQty ? (
            <span className="font-mono">
              {schemeBuyQty}+{schemeFreeQty}
            </span>
          ) : (
            'None'
          );
        },
      },
      {
        accessorKey: 'validFrom',
        header: 'Valid From',
        cell: ({ row }) => <DateCell value={row.original.validFrom} />,
      },
      {
        accessorKey: 'validTo',
        header: 'Valid To',
        cell: ({ row }) =>
          row.original.validTo ? (
            <DateCell value={row.original.validTo} />
          ) : (
            <Badge variant="outline">Open-ended</Badge>
          ),
      },
      {
        accessorKey: 'source',
        header: 'Source',
        cell: ({ row }) => <Badge variant="secondary">{PRICE_SOURCE_LABELS[row.original.source]}</Badge>,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => <DateTimeCell value={row.original.createdAt} />,
      },
    ],
    [showMrp],
  );

  const inventoryItemPricesTable = useDataTable({
    columns,
    query: inventoryItemPricesTableQuery,
    slug: `commerce-site-inventory-item-${inventoryItemId}-prices`,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEM_PRICES_TABLE_KEY(inventoryItemId) }),
  });

  return (
    <DataTable
      table={inventoryItemPricesTable}
      mode="tab"
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
