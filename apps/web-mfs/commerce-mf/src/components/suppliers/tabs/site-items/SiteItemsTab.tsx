import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  NumberCell,
  RowActions,
  StringCell,
  setTableContext,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList, Eye, Pencil } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SupplierSiteItemData } from '@/schemas/suppliers';
import type { SupplierEnrollmentBinding } from '../../bindings';
import { LeadTimeCell } from '../../LeadTimeCell';
import type { SupplierEnrollmentRef } from '../../types';
import { EditSupplierSiteItemTermsDialog } from './forms/EditSupplierSiteItemTermsDialog';

interface SiteItemsTabProps {
  binding: SupplierEnrollmentBinding;
  supplierRef: SupplierEnrollmentRef;
}

// The supplier's items set up at the site; a row's site terms (preferred, lead time) are edited in place, and the row
// opens the item for its prices
export const SiteItemsTab: React.FC<SiteItemsTabProps> = ({ binding, supplierRef }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const siteItemsTableQuery = binding.useSiteItemsTable(supplierRef);

  const refreshSiteItems = useCallback(
    () => queryClient.invalidateQueries({ queryKey: binding.siteItemsTableKey(supplierRef) }),
    [queryClient, binding, supplierRef],
  );

  // The item's page opens at the site: its table's saved context is set first and its cached rows dropped, so the page
  // loads that context instead of showing the old one
  const goToItem = useCallback(
    async (item: SupplierSiteItemData) => {
      const target = binding.siteItemTableContext?.(item.id, supplierRef);
      if (target?.context.length) {
        await setTableContext(target.tableSlug, target.context);
        queryClient.removeQueries({ queryKey: target.queryKey });
      }
      navigate(binding.siteItemPath(buildSlug(item.inventoryItemName, item.id), supplierRef), { relative: 'path' });
    },
    [navigate, binding, supplierRef, queryClient],
  );

  const columns = useMemo<ColumnDef<SupplierSiteItemData>[]>(
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
                permission: binding.permissions.siteItems.view,
                onClick: () => goToItem(row.original),
              },
              {
                id: 'edit',
                icon: Pencil,
                label: 'Edit',
                permission: binding.permissions.siteItems.edit,
                disabled: !row.original.supplierSiteItemId,
                disabledTip: 'The item is not set up at this site',
                dialog: {
                  title: 'Edit Site Terms',
                  description: `Update how this site buys ${row.original.inventoryItemName} from this supplier.`,
                  content: (close) => (
                    <EditSupplierSiteItemTermsDialog
                      useUpdateTerms={binding.useUpdateSiteItem}
                      supplierId={supplierRef.supplierId}
                      itemId={row.original.id}
                      supplierSiteItemId={row.original.supplierSiteItemId ?? ''}
                      terms={row.original}
                      onSuccess={() => {
                        refreshSiteItems();
                        close();
                      }}
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
    [binding, goToItem, refreshSiteItems, supplierRef],
  );

  const siteItemsTable = useDataTable({
    columns,
    query: siteItemsTableQuery,
    slug: binding.siteItemsTableSlug(supplierRef),
    label: 'item',
    enableRowSelection: false,
    enableSorting: true,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.siteItemsTableKey(supplierRef) }),
  });

  return (
    <DataTable
      table={siteItemsTable}
      mode="tab"
      permission={binding.permissions.siteItems.view}
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
