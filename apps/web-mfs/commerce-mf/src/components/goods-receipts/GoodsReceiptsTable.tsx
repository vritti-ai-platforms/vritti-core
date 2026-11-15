import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck, Plus } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type GoodsReceiptData, goodsReceiptStatusConfig } from '@/schemas/goods-receipts';
import { SiteFilter } from '@/selectors/site';
import type { GoodsReceiptsBinding } from './bindings';
import { CreateGoodsReceiptDialog } from './forms/CreateGoodsReceiptDialog';
import { GoodsReceiptStatusBadge } from './GoodsReceiptStatusBadge';
import { RECEIVE_DELIVERY_PARAM } from './receiveDeliverySearch';

interface GoodsReceiptsTableProps {
  binding: GoodsReceiptsBinding;
}

const STATUS_OPTIONS = Object.entries(goodsReceiptStatusConfig).map(([value, { label }]) => ({ label, value }));

// Goods receipts, newest first, each receiving one inbound delivery across its purchase orders; across the legal
// entity's sites they are narrowed by site and name it, and a row opens its receipt. A link carrying a delivery (its
// Receive action) opens New Goods Receipt with that delivery preselected
export const GoodsReceiptsTable: React.FC<GoodsReceiptsTableProps> = ({ binding }) => {
  const { permissions } = binding;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { available: canAdd } = usePermission(permissions.add);
  const [preselectedDeliveryId, setPreselectedDeliveryId] = useState<string>();
  const createDialog = useDialog({ onClose: () => setPreselectedDeliveryId(undefined) });
  const { open: openCreateDialog } = createDialog;
  const goodsReceiptsTableQuery = binding.useTable();
  const requestedDeliveryId = searchParams.get(RECEIVE_DELIVERY_PARAM);

  useEffect(() => {
    if (!requestedDeliveryId || !canAdd) return;
    setPreselectedDeliveryId(requestedDeliveryId);
    openCreateDialog();
    setSearchParams(
      (params) => {
        params.delete(RECEIVE_DELIVERY_PARAM);
        return params;
      },
      { replace: true },
    );
  }, [requestedDeliveryId, canAdd, openCreateDialog, setSearchParams]);

  const openReceipt = useCallback(
    (receipt: Pick<GoodsReceiptData, 'grNumber' | 'id'>) => navigate(buildSlug(receipt.grNumber, receipt.id)),
    [navigate],
  );

  const columns = useMemo<ColumnDef<GoodsReceiptData>[]>(
    () => [
      {
        accessorKey: 'grNumber',
        header: 'GR Number',
        cell: ({ row }) => <StringCell value={row.original.grNumber} mono />,
        enableSorting: true,
      },
      ...(binding.spansSites
        ? [
            {
              accessorKey: 'siteName',
              header: 'Site',
              cell: ({ row }) => <StringCell value={row.original.siteName} />,
              enableSorting: false,
            } satisfies ColumnDef<GoodsReceiptData>,
          ]
        : []),
      {
        accessorKey: 'receivedDate',
        header: 'Received Date',
        cell: ({ row }) => <DateCell value={row.original.receivedDate} />,
        enableSorting: true,
      },
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <GoodsReceiptStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'poNumbers',
        header: 'Purchase Orders',
        cell: ({ row }) => <StringCell value={row.original.poNumbers.join(', ')} mono />,
        enableSorting: false,
      },
      {
        accessorKey: 'deliveryNumber',
        header: 'Inbound Delivery',
        cell: ({ row }) => <StringCell value={row.original.deliveryNumber} mono />,
        enableSorting: true,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <StringCell value={row.original.notes} />,
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
                onClick: () => openReceipt(row.original),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [binding.spansSites, permissions.view, openReceipt],
  );

  const goodsReceiptsTable = useDataTable({
    columns,
    slug: binding.tableSlug,
    label: 'goods receipt',
    query: goodsReceiptsTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.tableKey }),
  });

  const newReceiptAction = (
    <Button
      size="sm"
      permission={permissions.add}
      startAdornment={<Plus className="size-4" />}
      onClick={createDialog.open}
    >
      New Goods Receipt
    </Button>
  );

  return (
    <>
      <DataTable
        table={goodsReceiptsTable}
        permission={permissions.view}
        contextBar={
          binding.spansSites && (
            <SiteFilter name="sites" label="Sites" placeholder="All sites" mode="context" multiple />
          )
        }
        searchConfig={{
          columns: [
            { id: 'grNumber', label: 'GR Number' },
            { id: 'supplierName', label: 'Supplier' },
            { id: 'poNumbers', label: 'PO Number' },
            { id: 'deliveryNumber', label: 'Delivery Number' },
          ],
          searchAll: true,
        }}
        filters={[<SelectFilter key="status" name="status" label="Status" multiple options={STATUS_OPTIONS} />]}
        toolbarActions={{ actions: newReceiptAction }}
        emptyStateConfig={{
          icon: PackageCheck,
          title: 'No goods receipts',
          description:
            "Receive an inbound delivery created for a supplier's confirmed purchase orders to start a goods receipt.",
          action: newReceiptAction,
        }}
      />

      <Dialog
        handle={createDialog}
        icon={PackageCheck}
        title="New Goods Receipt"
        description="Receive an announced inbound delivery; then count its goods on the draft."
        content={(close) => (
          <CreateGoodsReceiptDialog
            useCreateFromDelivery={binding.useCreateFromDelivery}
            inboundDeliveryId={preselectedDeliveryId}
            onSuccess={(receipt) => {
              close();
              openReceipt(receipt);
            }}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
