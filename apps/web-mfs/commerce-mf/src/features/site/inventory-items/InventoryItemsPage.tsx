import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyFieldFilter } from '@vritti/quantum-ui/CurrencyField';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';

import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, Package, PackagePlus, Pencil } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteStockCell } from '@/components/inventory-items/SiteStockCell';
import { INVENTORY_ITEMS_STOCK_TABLE_KEY, useInventoryItemsStockTable } from '@/hooks/site/inventory-items';
import { type SiteStockTableItemData, stockStatusFilterOptions } from '@/schemas/inventory-items';
import { CategoryFilter } from '@/selectors/category';
import { LocationFilter } from '@/selectors/location';
import { UomFilter } from '@/selectors/uom';
import { AddToSiteForm } from './forms/AddToSiteForm';
import { EditReplenishmentForm } from './forms/EditReplenishmentForm';

// The organization's items with how this site carries them: the stock on hand against their levels, split by the
// locations holding it; an item is bought and stocked here only once it is added to the site
export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inventoryItemsStockTableQuery = useInventoryItemsStockTable();
  const addDialog = useDialog();
  const workspaceCurrency = useWorkspaceCurrency();

  const openItem = useCallback((item: SiteStockTableItemData) => navigate(buildSlug(item.name, item.id)), [navigate]);

  const columns = useMemo<ColumnDef<SiteStockTableItemData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Item',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.name}</span>
            <StringCell value={row.original.sku} mono className="text-xs text-muted-foreground" />
          </div>
        ),
        enableSorting: true,
        size: 260,
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        enableSorting: false,
      },
      {
        id: 'stock',
        header: 'Stock',
        size: 460,
        meta: { grow: true, label: 'Stock' },
        cell: ({ row }) => <SiteStockCell stock={row.original} uomSymbol={row.original.uomSymbol} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: SITE_INVENTORY_ITEMS.view,
                onClick: () => openItem(row.original),
              },
              {
                id: 'add',
                icon: PackagePlus,
                label: 'Add to Site',
                permission: SITE_INVENTORY_ITEMS.setup.add,
                hidden: row.original.atSite,
                dialog: {
                  title: 'Add to Site',
                  className: 'max-w-2xl',
                  description: `${row.original.name} — this site can buy and stock it once it is added.`,
                  content: (close) => <AddToSiteForm item={row.original} onSuccess={close} onCancel={close} />,
                },
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit Replenishment',
                permission: SITE_INVENTORY_ITEMS.setup.edit,
                hidden: !row.original.atSite,
                dialog: {
                  title: 'Edit Replenishment',
                  className: 'max-w-2xl',
                  description: `How this site restocks ${row.original.name}.`,
                  content: (close) => <EditReplenishmentForm item={row.original} onSuccess={close} onCancel={close} />,
                },
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openItem],
  );

  const inventoryItemsTable = useDataTable({
    columns,
    slug: 'commerce-site-inventory-items',
    label: 'item',
    query: inventoryItemsStockTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_STOCK_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="The organization's items, and how this site carries them" />
      <DataTable
        table={inventoryItemsTable}
        permission={SITE_INVENTORY_ITEMS.view}
        contextBar={
          <SelectFilter
            key="stockStatus"
            name="stockStatus"
            label="Status"
            placeholder="All"
            multiple
            options={stockStatusFilterOptions}
            mode="context"
          />
        }
        filters={[
          <CategoryFilter key="categoryId" multiple />,
          <LocationFilter key="locationId" multiple />,
          <UomFilter key="uomId" multiple />,
          <CurrencyFieldFilter
            key="stockValue"
            name="stockValue"
            label="Stock Value"
            currencyCode={workspaceCurrency}
            withOperators
            allowZero
          />,
        ]}
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'sku', label: 'SKU' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<PackagePlus className="size-4" />}
              onClick={addDialog.open}
              permission={SITE_INVENTORY_ITEMS.setup.add}
            >
              Add to Site
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No inventory items',
          description: 'Items added to the organization appear here, ready to be added to this site.',
        }}
      />

      <Dialog
        handle={addDialog}
        icon={PackagePlus}
        title="Add to Site"
        className="max-w-2xl"
        description="Pick an item this site does not carry yet. The site can buy and stock it once it is added; levels are in the item's primary unit."
        content={(close) => <AddToSiteForm onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
