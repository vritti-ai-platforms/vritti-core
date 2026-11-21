import { useQueryClient } from '@tanstack/react-query';
import { SITE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyFieldFilter } from '@vritti/quantum-ui/CurrencyField';
import {
  type ColumnDef,
  DataTable,
  getSelectionColumn,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog, useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Ban, CircleCheck, Eye, Package, PackagePlus, Pencil } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteStockCell } from '@/components/inventory-items/SiteStockCell';
import {
  INVENTORY_ITEMS_STOCK_TABLE_KEY,
  useBulkAddToSite,
  useBulkUnblockSiteItems,
  useInventoryItemsStockTable,
} from '@/hooks/site/inventory-items';
import { type SiteStockTableItemData, stockStatusFilterOptions } from '@/schemas/inventory-items';
import { SiteItemStatusValues } from '@/schemas/site-items';
import { CategoryFilter } from '@/selectors/category';
import { LocationFilter } from '@/selectors/location';
import { UomFilter } from '@/selectors/uom';
import { AddToSiteForm } from './forms/AddToSiteForm';
import { BulkBlockSiteItemsForm } from './forms/BulkBlockSiteItemsForm';
import { EditReplenishmentForm } from './forms/EditReplenishmentForm';

// The organization's items with how this site carries them: the stock on hand against their levels, split by the
// locations holding it; an item is bought and stocked here only once it is added to the site
export const InventoryItemsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inventoryItemsStockTableQuery = useInventoryItemsStockTable();
  const addDialog = useDialog();
  const workspaceCurrency = useWorkspaceCurrency();
  const confirm = useConfirm();
  const bulkAddMutation = useBulkAddToSite();
  const bulkUnblockMutation = useBulkUnblockSiteItems();
  const blockDialog = useDialog();
  const [blockIds, setBlockIds] = useState<string[]>([]);

  const openItem = useCallback((item: SiteStockTableItemData) => navigate(buildSlug(item.name, item.id)), [navigate]);

  const columns = useMemo<ColumnDef<SiteStockTableItemData>[]>(
    () => [
      getSelectionColumn<SiteStockTableItemData>(),
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
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: INVENTORY_ITEMS_STOCK_TABLE_KEY }),
  });
  const { table } = inventoryItemsTable;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventory Items" description="The organization's items, and how this site carries them" />
      <DataTable
        table={inventoryItemsTable}
        permission={SITE_INVENTORY_ITEMS.view}
        selectActions={(rows) => {
          const ids = rows.map((row) => row.original.id);
          const carried = rows.some((row) => row.original.atSite);
          const allBlocked = rows.every((row) => row.original.siteItemStatus === SiteItemStatusValues.BLOCKED);
          const allBuyable = rows.every((row) => row.original.siteItemStatus === SiteItemStatusValues.ACTIVE);
          const resetSelection = { onSuccess: () => table.resetRowSelection() };
          return (
            <>
              <Button
                size="sm"
                variant="outline"
                permission={SITE_INVENTORY_ITEMS.setup.add}
                startAdornment={<PackagePlus className="size-4" />}
                isLoading={bulkAddMutation.isPending}
                disabled={carried}
                disabledTip="Some selected items are already at this site; select only items it does not carry."
                onClick={async () => {
                  const ok = await confirm({
                    title: `Add ${pluralize('item', ids.length, true)} to this site?`,
                    description: 'Each is restocked manually until you set its stock levels.',
                    confirmLabel: 'Add to Site',
                  });
                  if (ok) bulkAddMutation.mutate(ids, resetSelection);
                }}
              >
                Add to Site
              </Button>
              <Button
                size="sm"
                variant="outline"
                permission={SITE_INVENTORY_ITEMS.setup.block}
                startAdornment={<Ban className="size-4" />}
                disabled={!allBuyable}
                disabledTip="Some selected items are not at this site or already blocked; select only items it can buy."
                onClick={() => {
                  setBlockIds(ids);
                  blockDialog.open();
                }}
              >
                Block Purchasing
              </Button>
              <Button
                size="sm"
                variant="outline"
                permission={SITE_INVENTORY_ITEMS.setup.block}
                startAdornment={<CircleCheck className="size-4" />}
                isLoading={bulkUnblockMutation.isPending}
                disabled={!allBlocked}
                disabledTip="Some selected items are not blocked; select only items whose purchasing is blocked."
                onClick={() => bulkUnblockMutation.mutate(ids, resetSelection)}
              >
                Allow Purchasing
              </Button>
            </>
          );
        }}
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

      <Dialog
        handle={blockDialog}
        icon={Ban}
        iconVariant="destructive"
        title="Block Purchasing"
        description={`Stop this site buying ${pluralize('selected item', blockIds.length, true)}. Stock on hand and goods already ordered still move.`}
        content={(close) => (
          <BulkBlockSiteItemsForm
            inventoryItemIds={blockIds}
            onSuccess={() => {
              close();
              table.resetRowSelection();
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
