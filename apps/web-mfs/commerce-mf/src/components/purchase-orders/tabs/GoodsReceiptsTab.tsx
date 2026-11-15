import { useQueryClient } from '@tanstack/react-query';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  RowActions,
  StringCell,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck } from 'lucide-react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GoodsReceiptStatusBadge } from '@/components/goods-receipts/GoodsReceiptStatusBadge';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { workspaceBase } from '@/utils/workspace';
import type { PurchaseOrdersBinding } from '../bindings';

interface GoodsReceiptsTabProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
}

// The goods receipts counting any of the order's lines; a receipt is started from an inbound delivery, and a row opens
// the receipt in the goods receipts feature
export const GoodsReceiptsTab: React.FC<GoodsReceiptsTabProps> = ({ binding, purchaseOrder }) => {
  const purchaseOrderId = purchaseOrder.id;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const goodsReceiptsTableQuery = binding.useGoodsReceiptsTable(purchaseOrderId);

  const openReceipt = useCallback(
    (receipt: GoodsReceiptData) =>
      navigate(`${workspaceBase(pathname)}/goods-receipts/${buildSlug(receipt.grNumber, receipt.id)}`),
    [navigate, pathname],
  );

  const columns = useMemo<ColumnDef<GoodsReceiptData>[]>(
    () => [
      {
        accessorKey: 'grNumber',
        header: 'GR Number',
        cell: ({ row }) => <StringCell value={row.original.grNumber} mono />,
      },
      {
        accessorKey: 'receivedDate',
        header: 'Received Date',
        cell: ({ row }) => <DateCell value={row.original.receivedDate} />,
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
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <StringCell value={row.original.notes} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => openReceipt(row.original) }]} />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openReceipt],
  );

  const goodsReceiptsTable = useDataTable({
    columns,
    slug: binding.goodsReceiptsTableSlug(purchaseOrderId),
    label: 'goods receipt',
    query: goodsReceiptsTableQuery,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: binding.goodsReceiptsTableKey(purchaseOrderId) }),
  });

  return (
    <DataTable
      table={goodsReceiptsTable}
      mode="tab"
      permission={binding.permissions.view}
      emptyStateConfig={{
        icon: PackageCheck,
        title: 'No goods receipts',
        description:
          'Goods receipts counting lines of this purchase order will appear here. Receive an inbound delivery carrying its lines to start one.',
      }}
    />
  );
};
