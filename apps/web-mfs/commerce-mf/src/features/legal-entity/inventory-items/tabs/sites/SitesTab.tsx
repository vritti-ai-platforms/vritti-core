import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, StringCell, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { StatusSwitch } from '@vritti/quantum-ui/StatusSwitch';
import { Ban, Building2, PackagePlus, PackageX, Pencil } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { SiteStockCell } from '@/components/inventory-items/SiteStockCell';
import {
  LE_SITE_ITEMS_KEY,
  useRemoveFromLeSite,
  useSetLeSiteItemSupplierItemsRequired,
  useSiteItemsTable,
  useUnblockLeSiteItem,
} from '@/hooks/legal-entity/inventory-items';
import { stockStatusFilterOptions } from '@/schemas/inventory-items';
import { type SiteItemRowData, SiteItemStatusValues } from '@/schemas/site-items';
import { AddToLeSiteForm } from './forms/AddToLeSiteForm';
import { BlockLeSiteItemForm } from './forms/BlockLeSiteItemForm';
import { EditLeSiteReplenishmentForm } from './forms/EditLeSiteReplenishmentForm';

interface SitesTabProps {
  inventoryItemId: string;
  itemName: string;
  uomSymbol: string;
  // Whether the item's primary unit can be split; levels are whole numbers when it cannot
  uomAllowDecimal: boolean;
}

// The legal entity's sites with how each carries the item: the stock each holds by location, what it is worth, and where
// it sits against the site's levels; a site that does not carry it can have it added from its row
export const SitesTab: React.FC<SitesTabProps> = ({ inventoryItemId, itemName, uomSymbol, uomAllowDecimal }) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const siteItemsTableQuery = useSiteItemsTable(inventoryItemId);
  const removeMutation = useRemoveFromLeSite(inventoryItemId);
  const unblockMutation = useUnblockLeSiteItem(inventoryItemId);
  const sourcingMutation = useSetLeSiteItemSupplierItemsRequired(inventoryItemId);
  const addDialog = useDialog();
  const blockDialog = useDialog();
  // The site whose purchasing the block dialog is asked for
  const [blockingSite, setBlockingSite] = useState<SiteItemRowData | null>(null);

  const handleRemove = useCallback(
    async (row: SiteItemRowData) => {
      const confirmed = await confirm({
        title: `Remove from ${row.siteName}?`,
        description: `${row.siteName} can no longer buy or stock ${itemName}. It can't be removed while the site still holds stock or has open purchases for it.`,
        confirmLabel: 'Remove',
        variant: 'destructive',
      });
      if (confirmed) removeMutation.mutate(row.siteId);
    },
    [confirm, removeMutation, itemName],
  );

  // Switching a site's purchasing off asks why in a dialog; switching it back on confirms and unblocks
  const handleBlockedChange = useCallback(
    async (row: SiteItemRowData, blocked: boolean) => {
      if (blocked) {
        setBlockingSite(row);
        blockDialog.open();
        return;
      }
      const confirmed = await confirm({
        title: `Unblock purchasing at ${row.siteName}?`,
        description: `${row.siteName} can add ${itemName} to purchases and purchase orders again.`,
        confirmLabel: 'Unblock',
      });
      if (confirmed) unblockMutation.mutate(row.siteId);
    },
    [blockDialog, confirm, itemName, unblockMutation],
  );

  const columns = useMemo<ColumnDef<SiteItemRowData>[]>(
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
        id: 'stock',
        header: 'Stock',
        size: 460,
        meta: { grow: true, label: 'Stock' },
        cell: ({ row }) => <SiteStockCell stock={row.original} uomSymbol={uomSymbol} />,
      },
      {
        id: 'purchasing',
        header: 'Purchasing',
        enableSorting: false,
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.siteItemStatus === SiteItemStatusValues.BLOCKED}
            onCheckedChange={(blocked) => handleBlockedChange(row.original, blocked)}
            ariaLabel={`Block purchasing of ${itemName} at ${row.original.siteName}`}
            activeLabel="Blocked"
            inactiveLabel="Allowed"
            tone="destructive"
            permission={LE_INVENTORY_ITEMS.sites.block}
            disabled={!row.original.atSite}
            disabledTip="Add the item to this site first."
            isLoading={unblockMutation.isPending && unblockMutation.variables === row.original.siteId}
          />
        ),
      },
      {
        id: 'sourcing',
        header: 'Sourcing',
        enableSorting: false,
        cell: ({ row }) => (
          <StatusSwitch
            checked={row.original.supplierItemsRequired}
            onCheckedChange={(required) => sourcingMutation.mutate({ siteId: row.original.siteId, required })}
            ariaLabel={`Buy ${itemName} at ${row.original.siteName} only from suppliers set up for it`}
            activeLabel="Supplier Items Only"
            inactiveLabel="Site Rule"
            tone="info"
            permission={LE_INVENTORY_ITEMS.sites.edit}
            disabled={!row.original.atSite}
            disabledTip="Add the item to this site first."
            isLoading={sourcingMutation.isPending && sourcingMutation.variables?.siteId === row.original.siteId}
          />
        ),
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
                id: 'add',
                icon: PackagePlus,
                label: 'Add to Site',
                permission: LE_INVENTORY_ITEMS.sites.add,
                hidden: row.original.atSite,
                dialog: {
                  title: 'Add to Site',
                  className: 'max-w-2xl',
                  description: `${itemName} at ${row.original.siteName} — the site can buy and stock it once it is added.`,
                  content: (close) => (
                    <AddToLeSiteForm
                      inventoryItemId={inventoryItemId}
                      siteId={row.original.siteId}
                      uomSymbol={uomSymbol}
                      allowDecimal={uomAllowDecimal}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit Replenishment',
                permission: LE_INVENTORY_ITEMS.sites.edit,
                hidden: !row.original.atSite,
                dialog: {
                  title: 'Edit Replenishment',
                  className: 'max-w-2xl',
                  description: `How ${row.original.siteName} restocks ${itemName}.`,
                  content: (close) => (
                    <EditLeSiteReplenishmentForm
                      inventoryItemId={inventoryItemId}
                      row={row.original}
                      uomSymbol={uomSymbol}
                      allowDecimal={uomAllowDecimal}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
              {
                id: 'remove',
                icon: PackageX,
                label: 'Remove from Site',
                variant: 'destructive',
                permission: LE_INVENTORY_ITEMS.sites.delete,
                hidden: !row.original.atSite,
                onClick: () => handleRemove(row.original),
              },
            ]}
          />
        ),
      },
    ],
    [
      handleRemove,
      handleBlockedChange,
      inventoryItemId,
      itemName,
      uomSymbol,
      uomAllowDecimal,
      unblockMutation,
      sourcingMutation,
    ],
  );

  const siteItemsTable = useDataTable({
    columns,
    query: siteItemsTableQuery,
    slug: `commerce-le-inventory-item-${inventoryItemId}-sites`,
    label: 'site',
    enableRowSelection: false,
    enableSorting: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: LE_SITE_ITEMS_KEY(inventoryItemId) }),
  });

  return (
    <>
      <DataTable
        table={siteItemsTable}
        mode="tab"
        permission={LE_INVENTORY_ITEMS.sites.view}
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
              startAdornment={<PackagePlus className="size-4" />}
              onClick={addDialog.open}
              permission={LE_INVENTORY_ITEMS.sites.add}
            >
              Add to Site
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
        handle={addDialog}
        icon={PackagePlus}
        title="Add to Site"
        className="max-w-2xl"
        description={`Pick a site that does not carry ${itemName} yet. The site can buy and stock it once it is added.`}
        content={(close) => (
          <AddToLeSiteForm
            inventoryItemId={inventoryItemId}
            uomSymbol={uomSymbol}
            allowDecimal={uomAllowDecimal}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />

      <Dialog
        handle={blockDialog}
        icon={Ban}
        title="Block Purchasing"
        description={`${blockingSite?.siteName} stops adding ${itemName} to purchases and purchase orders. Stock on hand and goods already ordered still move.`}
        content={(close) =>
          blockingSite && (
            <BlockLeSiteItemForm
              inventoryItemId={inventoryItemId}
              siteId={blockingSite.siteId}
              onSuccess={close}
              onCancel={close}
            />
          )
        }
      />
    </>
  );
};
