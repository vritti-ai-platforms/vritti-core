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
import { Eye, Package, PackageCheck, Pencil } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockLevelsCell } from '@/components/inventory-items/StockLevelsCell';
import { INVENTORY_ITEMS_STOCK_TABLE_KEY, useInventoryItemsStockTable } from '@/hooks/site/inventory-items';
import { type SiteStockTableItemData, stockStatusFilterOptions } from '@/schemas/inventory-items';
import { CategoryFilter } from '@/selectors/category';
import { LocationFilter } from '@/selectors/location';
import { UomFilter } from '@/selectors/uom';
import { EditStockLevelsForm } from './forms/EditStockLevelsForm';
import { SetStockLevelsForm } from './forms/SetStockLevelsForm';

// The organization's items with their stock levels at this site: the stock on hand against them, split by the locations
// holding it; an item is bought and stocked here only once its stock levels are set
export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inventoryItemsStockTableQuery = useInventoryItemsStockTable();
  const setDialog = useDialog();
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
        id: 'stockLevels',
        header: 'Stock Levels',
        size: 460,
        meta: { grow: true, label: 'Stock Levels' },
        cell: ({ row }) => <StockLevelsCell stock={row.original} uomSymbol={row.original.uomSymbol} />,
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
                id: 'set',
                icon: PackageCheck,
                label: 'Set Stock Levels',
                permission: SITE_INVENTORY_ITEMS.stockLevels.add,
                hidden: row.original.hasStockLevels,
                dialog: {
                  title: 'Set Stock Levels',
                  description: `${row.original.name} — this site can buy and stock it once they are set.`,
                  content: (close) => <SetStockLevelsForm item={row.original} onSuccess={close} onCancel={close} />,
                },
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit Stock Levels',
                permission: SITE_INVENTORY_ITEMS.stockLevels.edit,
                hidden: !row.original.hasStockLevels,
                dialog: {
                  title: 'Edit Stock Levels',
                  description: `${row.original.name} at this site.`,
                  content: (close) => <EditStockLevelsForm item={row.original} onSuccess={close} onCancel={close} />,
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
      <PageHeader title="Inventory Items" description="The organization's items, and their stock levels at this site" />
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
              startAdornment={<PackageCheck className="size-4" />}
              onClick={setDialog.open}
              permission={SITE_INVENTORY_ITEMS.stockLevels.add}
            >
              Set Stock Levels
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Package,
          title: 'No inventory items',
          description: 'Items added to the organization appear here, ready for their stock levels at this site.',
        }}
      />

      <Dialog
        handle={setDialog}
        icon={PackageCheck}
        title="Set Stock Levels"
        description="Pick an item this site has no stock levels for. The site can buy and stock it once they are set; levels are in the item's primary unit."
        content={(close) => <SetStockLevelsForm onSuccess={close} onCancel={close} />}
      />
    </div>
  );
};
