import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList, Eye, Pencil } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SiteSupplierItemData } from '@/schemas/suppliers';
import type { SupplierSiteBinding } from '../bindings';
import { EditItemTermsDialog } from '../forms/EditItemTermsDialog';
import { LeadTimeCell } from '../LeadTimeCell';
import type { SupplierSiteRef } from '../types';

interface ItemsTabProps {
  binding: SupplierSiteBinding;
  supplierRef: SupplierSiteRef;
}

export const ItemsTab: React.FC<ItemsTabProps> = ({ binding, supplierRef }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: response, isLoading } = binding.useSiteItemsTable(supplierRef);

  const goToItem = useCallback(
    (item: SiteSupplierItemData) => navigate(buildSlug(item.inventoryItemName, item.id)),
    [navigate],
  );

  const columns = useMemo<ColumnDef<SiteSupplierItemData>[]>(
    () => [
      {
        accessorKey: 'inventoryItemName',
        header: 'Inventory Item',
        cell: ({ row }) => <StringCell value={row.original.inventoryItemName} />,
      },
      {
        accessorKey: 'supplierItemCode',
        header: 'Supplier Item Code',
        cell: ({ row }) => <StringCell value={row.original.supplierItemCode} />,
      },
      {
        accessorKey: 'uomSymbol',
        header: 'UOM',
        cell: ({ row }) => row.original.uomSymbol,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Unit Price',
        enableSorting: false,
        cell: ({ row }) => <CurrencyCell value={row.original.unitPrice} />,
      },
      {
        accessorKey: 'minOrderQuantity',
        header: 'Min Order',
        cell: ({ row }) =>
          row.original.minOrderQuantity != null ? <NumberCell value={row.original.minOrderQuantity} /> : '—',
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Lead Time',
        cell: ({ row }) => (
          <LeadTimeCell days={row.original.leadTimeDays} overridden={row.original.isLeadTimeOverridden} />
        ),
      },
      {
        accessorKey: 'isPreferred',
        header: 'Preferred',
        cell: ({ row }) => (row.original.isPreferred ? <Badge variant="success">Yes</Badge> : '—'),
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
                id: 'view',
                icon: Eye,
                label: 'View',
                permission: binding.permissions.items.view,
                onClick: () => goToItem(row.original),
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit Site Terms',
                permission: binding.permissions.items.edit,
                hidden: !row.original.itemSiteId,
                dialog: {
                  title: 'Edit Site Terms',
                  description: 'Update how this site buys the item from this supplier.',
                  content: (close) => (
                    <EditItemTermsDialog
                      binding={binding}
                      supplierRef={supplierRef}
                      itemId={row.original.id}
                      rowId={row.original.itemSiteId ?? ''}
                      terms={row.original}
                      onSuccess={close}
                      onCancel={close}
                    />
                  ),
                },
              },
            ]}
          />
        ),
      },
    ],
    [binding, supplierRef, goToItem],
  );

  const { table } = useDataTable({
    columns,
    serverState: response,
    slug: binding.itemsTableSlug(supplierRef),
    label: 'item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.itemsTableKey(supplierRef) }),
  });

  return (
    <DataTable
      table={table}
      mode="tab"
      isLoading={isLoading}
      permission={binding.permissions.items.view}
      searchConfig={{
        columns: [
          { id: 'inventoryItemName', label: 'Item name' },
          { id: 'supplierItemCode', label: 'Supplier item code' },
        ],
        searchAll: true,
      }}
      emptyStateConfig={{
        icon: ClipboardList,
        title: 'No items',
        description: 'This supplier has no items set up at this site yet.',
      }}
    />
  );
};
