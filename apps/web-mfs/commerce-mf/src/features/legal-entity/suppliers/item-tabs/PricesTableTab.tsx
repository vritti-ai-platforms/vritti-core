import { useQueryClient } from '@tanstack/react-query';
import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { useConfirm } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { CalendarClock, Pencil, Trash2 } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { EditSitePriceDialog } from '@/components/suppliers/forms/EditSitePriceDialog';
import { supplierPriceColumns } from '@/components/suppliers/priceColumns';
import {
  SUPPLIER_ITEM_PRICES_TABLE_KEY,
  useDeleteSupplierSiteItemPrice,
  useSupplierItemPricesTable,
} from '@/hooks/legal-entity/suppliers';
import type { SupplierItemPriceRow } from '@/schemas/suppliers';
import { isPriceInForce } from '@/utils/supplierPrice';
import { siteBinding } from '../siteBinding';

interface PricesTableTabProps {
  supplierId: string;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // Every currency a price may be in
  currencyCodes: string[];
  addButton: React.ReactNode;
}

// Every price record of the supplier item across the legal entity's sites, newest timeline first
export const PricesTableTab: React.FC<PricesTableTabProps> = ({
  supplierId,
  itemId,
  inventoryItemId,
  uomId,
  currencyCodes,
  addButton,
}) => {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const supplierRef = useMemo(() => ({ supplierId }), [supplierId]);
  const { data: response, isLoading } = useSupplierItemPricesTable(supplierId, itemId);
  const deleteMutation = useDeleteSupplierSiteItemPrice(supplierRef, itemId);
  const showMrp = usePermission(LE_INVENTORY_ITEMS.mrp.view).available;

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
      ...supplierPriceColumns({ showMrp, showSite: true }),
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
                  permission: LE_SUPPLIERS.items.prices.edit,
                  disabled: !!quotationTip,
                  disabledTip: quotationTip,
                  dialog: {
                    title: 'Edit Price',
                    description: isPriceInForce(row.original)
                      ? 'Change the end date of this price.'
                      : 'Update this scheduled price.',
                    content: (close) => (
                      <EditSitePriceDialog
                        binding={siteBinding}
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
                  permission: LE_SUPPLIERS.items.prices.delete,
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
    [showMrp, supplierRef, itemId, inventoryItemId, uomId, currencyCodes, handleDelete],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: `commerce-supplier-item-${itemId}-prices`,
    label: 'price record',
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: SUPPLIER_ITEM_PRICES_TABLE_KEY(supplierId, itemId) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={LE_SUPPLIERS.items.prices.view}
      toolbarActions={{ actions: addButton }}
      emptyStateConfig={{
        icon: CalendarClock,
        title: 'No prices',
        description: "Add a price for one or more sites to start this item's timeline.",
        action: addButton,
      }}
    />
  );
};
