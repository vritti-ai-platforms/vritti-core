import { SITE_GROUP_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { type ColumnDef, NumberCell } from '@vritti/quantum-ui/DataTable';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { useMemo } from 'react';
import { InventoryItemsTable } from '@/components/inventory-items/InventoryItemsTable';
import {
  SITE_GROUP_INVENTORY_ITEMS_TABLE_KEY,
  useSiteGroupInventoryItemsTable,
} from '@/hooks/site-group/inventory-items';
import type { SiteGroupInventoryItemData } from '@/schemas/inventory-items';

export const InventoryItemsPage = () => {
  const { data: response, isLoading } = useSiteGroupInventoryItemsTable();

  const extraColumns = useMemo<ColumnDef<SiteGroupInventoryItemData>[]>(
    () => [
      {
        accessorKey: 'enabledSiteCount',
        header: 'Sites',
        cell: ({ row }) => <NumberCell value={row.original.enabledSiteCount} />,
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory Items"
        description="The organization's items, and how many sites in this group stock each one"
      />

      <InventoryItemsTable
        response={response}
        isLoading={isLoading}
        slug="commerce-site-group-inventory-items"
        tableKey={SITE_GROUP_INVENTORY_ITEMS_TABLE_KEY}
        permission={SITE_GROUP_INVENTORY_ITEMS.view}
        extraColumns={extraColumns}
      />
    </div>
  );
};
