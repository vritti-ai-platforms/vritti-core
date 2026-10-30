import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import type { SupplierItemPriceRow } from '@/schemas/suppliers';
import { isPriceInForce } from '@/utils/supplierPrice';
import type { SupplierSiteBinding } from '../bindings';
import { AddSitePriceDialog } from '../forms/AddSitePriceDialog';
import { EditSitePriceDialog } from '../forms/EditSitePriceDialog';
import { supplierPriceColumns } from '../priceColumns';
import type { SupplierSiteRef } from '../types';

interface PricesTabProps {
  binding: SupplierSiteBinding;
  supplierRef: SupplierSiteRef;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  currencyCode: string;
  currencyCodes: string[];
  // Prices can be added only once the item is set up at the site
  isSetUp: boolean;
}

export const PricesTab: React.FC<PricesTabProps> = ({
  binding,
  supplierRef,
  itemId,
  inventoryItemId,
  uomId,
  currencyCode,
  currencyCodes,
  isSetUp,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const addDialog = useDialog();
  const { data: response, isLoading } = binding.useSitePricesTable(supplierRef, itemId);
  const deleteMutation = binding.useDeleteSitePrice(supplierRef, itemId);

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

  const showMrp = usePermission(binding.permissions.mrp.view).available;
  const columns = useMemo<ColumnDef<SupplierItemPriceRow>[]>(
    () => [
      ...supplierPriceColumns({ showMrp, showSite: false }),
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const quotationTip = row.original.quotationSiteId
            ? 'Posted by a quotation — change it through the quotation'
            : undefined;
          return (
            <RowActions
              actions={[
                {
                  id: 'edit',
                  icon: Pencil,
                  label: 'Edit',
                  permission: binding.permissions.prices.edit,
                  disabled: !!quotationTip,
                  disabledTip: quotationTip,
                  dialog: {
                    title: 'Edit Price',
                    description: isPriceInForce(row.original)
                      ? 'Change the end date of this price.'
                      : 'Update this scheduled price.',
                    content: (close) => (
                      <EditSitePriceDialog
                        binding={binding}
                        supplierRef={supplierRef}
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
                  permission: binding.permissions.prices.delete,
                  hidden: isPriceInForce(row.original),
                  disabled: !!quotationTip,
                  disabledTip: quotationTip,
                  onClick: () => handleDelete(row.original),
                },
              ]}
            />
          );
        },
      },
    ],
    [showMrp, binding, supplierRef, itemId, inventoryItemId, uomId, currencyCodes, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: binding.pricesTableSlug(supplierRef, itemId),
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.pricesTableKey(supplierRef, itemId) }),
  });

  return (
    <>
      <DataTable
        table={table}
        mode="tab"
        isLoading={isLoading}
        permission={binding.permissions.prices.view}
        toolbarActions={{
          actions: (
            <Button
              size="sm"
              permission={binding.permissions.prices.add}
              disabled={!isSetUp}
              disabledTip="Set the item up at this site before pricing it"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Price
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: CalendarClock,
          title: 'No prices',
          description: 'Add a price to start the validity-dated timeline for this item at this site.',
          action: (
            <Button
              permission={binding.permissions.prices.add}
              disabled={!isSetUp}
              disabledTip="Set the item up at this site before pricing it"
              startAdornment={<Plus className="size-4" />}
              onClick={addDialog.open}
            >
              Add Price
            </Button>
          ),
        }}
      />

      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Price"
        description="Add a site-specific price for this item at your site."
        content={(close) => (
          <AddSitePriceDialog
            binding={binding}
            supplierRef={supplierRef}
            itemId={itemId}
            inventoryItemId={inventoryItemId}
            uomId={uomId}
            currencyCode={currencyCode}
            currencyCodes={currencyCodes}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
