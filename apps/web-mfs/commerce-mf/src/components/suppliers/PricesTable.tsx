import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { isoTodayDate, workspaceTimeZone } from '@vritti/quantum-ui/timezone';
import { CalendarClock, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { SupplierItemPriceRow } from '@/schemas/suppliers';
import { EnrolledSiteFilter } from '@/selectors/enrolled-site';
import { isPriceInForce } from '@/utils/supplierPrice';
import type { SupplierItemPricesBinding } from './bindings';
import { EditSitePriceDialog } from './forms/EditSitePriceDialog';
import { supplierPriceColumns } from './priceColumns';

interface PricesTableProps {
  prices: SupplierItemPricesBinding;
  supplierId: string;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  currencyCodes: string[];
  siteId?: string;
  addAction: React.ReactNode;
}

// A supplier item's price timeline at one site, newest first — the workspace's site, or the one picked in the context bar
export const PricesTable: React.FC<PricesTableProps> = ({
  prices,
  supplierId,
  itemId,
  inventoryItemId,
  uomId,
  currencyCodes,
  addAction,
  siteId,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const pricesTableQuery = prices.usePricesTable(supplierId, itemId);
  const deleteMutation = prices.useDeletePrice(supplierId, itemId);
  const showMrp = usePermission(prices.permissions.mrp.view).available;
  const slug = prices.tableSlug(supplierId, itemId);

  const handleDelete = useCallback(
    async (row: SupplierItemPriceRow) => {
      const confirmed = await confirm({
        title: 'Delete scheduled price?',
        description: 'The previous price re-opens when the windows are contiguous.',
        confirmLabel: 'Delete',
        variant: 'destructive',
      });
      if (confirmed) deleteMutation.mutate(row.id);
    },
    [confirm, deleteMutation],
  );

  const columns = useMemo<ColumnDef<SupplierItemPriceRow>[]>(
    () => [
      ...supplierPriceColumns({ showMrp }),
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row, table }) => {
          // Today at the workspace's site, or at the site picked in the context bar
          const site = siteId ?? table.options.meta?.contextValue('site');
          const today = isoTodayDate(workspaceTimeZone(site));
          // A site reads the legal entity's prices but changes only its own; it overrides one by adding its own
          const isLegalEntityPrice = !!siteId && !row.original.siteId;
          const locked = isLegalEntityPrice || !!row.original.quotationSiteId;
          const lockedTip = isLegalEntityPrice
            ? "The legal entity's price for all sites — add a price for this site to override it"
            : 'Posted by a quotation — change it through the quotation';
          return (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: prices.permissions.edit,
                  disabled: locked,
                  disabledTip: lockedTip,
                  dialog: {
                    title: 'Edit Price',
                    description: isPriceInForce(row.original, today)
                      ? 'Change the end date of this price.'
                      : 'Update this scheduled price.',
                    content: (close) => (
                      <EditSitePriceDialog
                        useUpdatePrice={prices.useUpdatePrice}
                        mrpPermission={prices.permissions.mrp.edit}
                        supplierId={supplierId}
                        itemId={itemId}
                        inventoryItemId={inventoryItemId}
                        uomId={uomId}
                        currencyCodes={currencyCodes}
                        price={row.original}
                        onSuccess={close}
                        onCancel={close}
                      />
                    ),
                  },
                },
                {
                  id: 'delete',
                  icon: Trash2,
                  label: 'Delete',
                  variant: 'destructive',
                  permission: prices.permissions.delete,
                  hidden: isPriceInForce(row.original, today),
                  disabled: locked,
                  disabledTip: lockedTip,
                  onClick: () => handleDelete(row.original),
                },
              ]}
            />
          );
        },
      },
    ],
    [prices, showMrp, siteId, supplierId, itemId, inventoryItemId, uomId, currencyCodes, handleDelete],
  );

  const pricesTable = useDataTable({
    columns,
    query: pricesTableQuery,
    slug,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: prices.tableKey(supplierId, itemId) }),
  });

  return (
    <DataTable
      table={pricesTable}
      mode="tab"
      permission={prices.permissions.view}
      toolbarActions={{ actions: addAction }}
      contextBar={
        prices.spansSites && (
          <EnrolledSiteFilter
            name="site"
            label="Site"
            mode="context"
            supplierId={supplierId}
            clearable={false}
            selectFirst
          />
        )
      }
      emptyStateConfig={{
        icon: CalendarClock,
        title: 'No prices',
        description: "Add a price to start this item's validity-dated timeline.",
        action: addAction,
      }}
    />
  );
};
