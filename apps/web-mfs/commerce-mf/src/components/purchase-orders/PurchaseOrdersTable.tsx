import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ClipboardList, Eye, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type PurchaseOrderData, purchaseOrderStatusConfig } from '@/schemas/purchase-orders';
import { SiteFilter } from '@/selectors/site';
import type { PurchaseOrdersBinding } from './bindings';
import { CreatePurchaseOrderDialog } from './forms/CreatePurchaseOrderDialog';
import { PurchaseOrderStatusBadge } from './PurchaseOrderStatusBadge';

interface PurchaseOrdersTableProps {
  binding: PurchaseOrdersBinding;
}

const STATUS_OPTIONS = Object.entries(purchaseOrderStatusConfig).map(([value, { label }]) => ({ label, value }));

// Purchase orders, newest first; across the legal entity's sites they are narrowed by site and name it, and a row opens its order
export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({ binding }) => {
  const { permissions, suppliers } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createDialog = useDialog();
  const purchaseOrdersTableQuery = binding.useTable();

  const openPurchaseOrder = useCallback(
    (purchaseOrder: PurchaseOrderData) => navigate(buildSlug(purchaseOrder.poNumber, purchaseOrder.id)),
    [navigate],
  );

  const columns = useMemo<ColumnDef<PurchaseOrderData>[]>(
    () => [
      {
        accessorKey: 'poNumber',
        header: 'PO Number',
        cell: ({ row }) => <StringCell value={row.original.poNumber} mono />,
        enableSorting: true,
      },
      ...(binding.spansSites
        ? [
            {
              accessorKey: 'siteName',
              header: 'Site',
              cell: ({ row }) => <StringCell value={row.original.siteName ?? row.original.siteCode} />,
              enableSorting: false,
            } satisfies ColumnDef<PurchaseOrderData>,
          ]
        : []),
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        enableSorting: true,
      },
      {
        accessorKey: 'orderDate',
        header: 'Order Date',
        cell: ({ row }) => <DateCell value={row.original.orderDate} />,
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <PurchaseOrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) => <CurrencyCell value={row.original.totalAmount} exchangeRate={row.original.exchangeRate} />,
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
                permission: permissions.view,
                onClick: () => openPurchaseOrder(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [binding.spansSites, permissions.view, openPurchaseOrder],
  );

  const purchaseOrdersTable = useDataTable({
    columns,
    slug: binding.tableSlug,
    label: 'purchase order',
    query: purchaseOrdersTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });

  const newPurchaseOrderAction = (
    <Button
      size="sm"
      permission={permissions.add}
      startAdornment={<Plus className="size-4" />}
      onClick={createDialog.open}
    >
      New Purchase Order
    </Button>
  );

  return (
    <>
      <DataTable
        table={purchaseOrdersTable}
        permission={permissions.view}
        onRowClick={openPurchaseOrder}
        contextBar={
          binding.spansSites && (
            <SiteFilter name="sites" label="Sites" placeholder="All sites" mode="context" multiple />
          )
        }
        searchConfig={{
          columns: [
            { id: 'poNumber', label: 'PO Number' },
            { id: 'supplierName', label: 'Supplier' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter key="status" name="status" label="Status" multiple options={STATUS_OPTIONS} />,
          <suppliers.Filter key="supplierId" />,
        ]}
        toolbarActions={{ actions: newPurchaseOrderAction }}
        emptyStateConfig={{
          icon: ClipboardList,
          title: 'No purchase orders',
          description: 'Create your first purchase order to start tracking procurement.',
          action: newPurchaseOrderAction,
        }}
      />

      <Dialog
        handle={createDialog}
        className="max-w-2xl"
        icon={ClipboardList}
        title="New Purchase Order"
        description="Create a purchase order for a supplier."
        content={(close) => <CreatePurchaseOrderDialog binding={binding} onSuccess={close} onCancel={close} />}
      />
    </>
  );
};
