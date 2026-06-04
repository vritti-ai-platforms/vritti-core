import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, DateCell, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { SelectFilter } from '@vritti/quantum-ui/Select';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOODS_RECEIPTS_TABLE_KEY } from '@/hooks/goods-receipts/keys';
import { useGoodsReceiptsTable } from '@/hooks/goods-receipts/useGoodsReceiptsTable';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { goodsReceiptStatusConfig } from '@/schemas/goods-receipts';
import { CreateGoodsReceiptDialog } from './forms/CreateGoodsReceiptDialog';

export const GoodsReceiptsPage = () => {
  const navigate = useNavigate();
  const createDialog = useDialog();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGoodsReceiptsTable();

  const columns = useMemo<ColumnDef<GoodsReceiptData>[]>(
    () => [
      {
        accessorKey: 'grNumber',
        header: 'GR Number',
        enableSorting: true,
      },
      {
        accessorKey: 'receivedDate',
        header: 'Received Date',
        cell: ({ row }) => <DateCell value={row.original.receivedDate} />,
        enableSorting: true,
      },
      {
        accessorKey: 'supplierName',
        header: 'Supplier',
        cell: ({ row }) => row.original.supplierName,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = goodsReceiptStatusConfig[row.original.status];
          return <Badge variant={config.variant}>{config.label}</Badge>;
        },
      },
      {
        accessorKey: 'po',
        header: 'Purchase Order',
        cell: ({ row }) => row.original.po?.poNumber ?? '--',
        enableSorting: false,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => row.original.notes ?? '--',
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
                onClick: () => navigate(buildSlug(row.original.grNumber, row.original.id)),
              },
            ]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [navigate],
  );

  const { table } = useDataTable({
    columns,
    slug: 'commerce-goods-receipts',
    label: 'goods receipt',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_TABLE_KEY }),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Goods Receipts"
        description="Track goods received from suppliers, with or without purchase orders"
      />

      <DataTable
        table={table}
        isLoading={isLoading}
        searchConfig={{
          columns: [
            { id: 'grNumber', label: 'GR Number' },
            { id: 'supplierName', label: 'Supplier' },
            { id: 'poNumber', label: 'PO Number' },
          ],
          searchAll: true,
        }}
        filters={[
          <SelectFilter
            key="status"
            name="status"
            label="Status"
            multiple
            options={Object.entries(goodsReceiptStatusConfig).map(([value, { label }]) => ({ label, value }))}
          />,
        ]}
        toolbarActions={{
          actions: (
            <Button size="sm" onClick={createDialog.open}>
              <Plus className="mr-2 size-4" />
              New Goods Receipt
            </Button>
          ),
        }}
        emptyStateConfig={{
          icon: PackageCheck,
          title: 'No goods receipts',
          description: 'Goods receipts created from purchase orders or standalone receipts will appear here.',
          action: (
            <Button onClick={createDialog.open}>
              <Plus className="mr-2 size-4" />
              New Goods Receipt
            </Button>
          ),
        }}
      />

      <Dialog
        handle={createDialog}
        title="New Goods Receipt"
        description="Create a draft goods receipt. Add line items from the detail page."
        content={(close) => (
          <CreateGoodsReceiptDialog
            onSuccess={(receipt) => {
              close();
              navigate(buildSlug(receipt.grNumber, receipt.id));
            }}
            onCancel={close}
          />
        )}
      />
    </div>
  );
};
