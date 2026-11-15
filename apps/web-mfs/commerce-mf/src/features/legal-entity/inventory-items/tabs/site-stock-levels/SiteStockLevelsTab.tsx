import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { Building2, PackageCheck, PackageX, Pencil } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { StockLevelsCell } from '@/components/inventory-items/StockLevelsCell';
import {
  LE_SITE_STOCK_LEVELS_KEY,
  useDeleteSiteStockLevels,
  useSiteStockLevelsTable,
} from '@/hooks/legal-entity/inventory-items';
import { stockStatusFilterOptions } from '@/schemas/inventory-items';
import type { SiteStockLevelData } from '@/schemas/site-stock-levels';
import { EditSiteStockLevelsForm } from './forms/EditSiteStockLevelsForm';
import { SetSiteStockLevelsForm } from './forms/SetSiteStockLevelsForm';

interface SiteStockLevelsTabProps {
  inventoryItemId: string;
  itemName: string;
  uomSymbol: string | null;
}

// The legal entity's sites with the item's stock levels at each: the stock each holds by location, what it is worth, and
// where it sits against the site's stock levels; a site without them can have them set from its row
export const SiteStockLevelsTab: React.FC<SiteStockLevelsTabProps> = ({ inventoryItemId, itemName, uomSymbol }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const siteStockLevelsTableQuery = useSiteStockLevelsTable(inventoryItemId);
  const deleteMutation = useDeleteSiteStockLevels(inventoryItemId);
  const setDialog = useDialog();

  const handleRemove = useCallback(
    async (row: SiteStockLevelData) => {
      const confirmed = await confirm({
        title: `Remove stock levels at ${row.siteName}?`,
        description: `${row.siteName} can no longer buy or stock ${itemName}. Stock levels can't be removed while the site still holds stock or has open purchases for it.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.siteId);
    },
    [confirm, deleteMutation, itemName],
  );

  const columns = useMemo<ColumnDef<SiteStockLevelData>[]>(
    () => [
      {
        accessorKey: 'siteName',
        header: 'Site',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.original.siteName}</span>
            <StringCell value={row.original.siteCode} mono className="text-xs text-muted-foreground" />
          </div>
        ),
      },
      {
        id: 'stockLevels',
        header: 'Stock Levels',
        size: 460,
        meta: { grow: true, label: 'Stock Levels' },
        cell: ({ row }) => <StockLevelsCell stock={row.original} uomSymbol={uomSymbol} />,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <RowActions
            actions={[
              {
                id: 'set',
                icon: PackageCheck,
                label: 'Set Stock Levels',
                permission: LE_INVENTORY_ITEMS.siteStockLevels.add,
                hidden: row.original.hasStockLevels,
                dialog: {
                  title: 'Set Stock Levels',
                  description: `${itemName} at ${row.original.siteName} — the site can buy and stock it once they are set.`,
                  content: (close) => (
                    <SetSiteStockLevelsForm
                      inventoryItemId={inventoryItemId}
                      siteId={row.original.siteId}
                      uomSymbol={uomSymbol}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit Stock Levels',
                permission: LE_INVENTORY_ITEMS.siteStockLevels.edit,
                hidden: !row.original.hasStockLevels,
                dialog: {
                  title: 'Edit Stock Levels',
                  description: `${itemName} at ${row.original.siteName}.`,
                  content: (close) => (
                    <EditSiteStockLevelsForm
                      inventoryItemId={inventoryItemId}
                      row={row.original}
                      uomSymbol={uomSymbol}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'remove',
                icon: PackageX,
                label: 'Remove Stock Levels',
                variant: 'destructive',
                permission: LE_INVENTORY_ITEMS.siteStockLevels.delete,
                hidden: !row.original.hasStockLevels,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [handleRemove, inventoryItemId, itemName, uomSymbol],
  );

  const siteStockLevelsTable = useDataTable({
    columns,
    query: siteStockLevelsTableQuery,
    slug: `commerce-le-inventory-item-${inventoryItemId}-site-stock-levels`,
    label: 'site',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: LE_SITE_STOCK_LEVELS_KEY(inventoryItemId) }),
  });

  return (
    <>
      <DataTable
        table={siteStockLevelsTable}
        mode="tab"
        permission={LE_INVENTORY_ITEMS.siteStockLevels.view}
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
        searchConfig={{
          columns: [
            { id: 'name', label: 'Name' },
            { id: 'code', label: 'Code' },
          ],
          searchAll: true,
        }}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              startAdornment={<PackageCheck className="size-4" />}
              onClick={setDialog.open}
              permission={LE_INVENTORY_ITEMS.siteStockLevels.add}
            >
              Set Stock Levels
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: Building2,
          title: 'No sites',
          description: 'No site of the legal entity matches.',
        }}
      />

      <Dialog
        handle={setDialog}
        icon={PackageCheck}
        title="Set Stock Levels"
        description={`Pick a site with no stock levels for ${itemName}. The site can buy and stock it once they are set.`}
        content={(close) => (
          <SetSiteStockLevelsForm
            inventoryItemId={inventoryItemId}
            uomSymbol={uomSymbol}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
