import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@vritti/quantum-ui/Button';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOODS_RECEIPTS_KEY, useGoodsReceipts } from '@/hooks/useGoodsReceipts';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';

interface GoodsReceiptsTabProps {
  poId: string;
  canReceive: boolean;
  isActive: boolean;
  onOpenReceiveDialog: () => void;
}

export const GoodsReceiptsTab = ({ poId, canReceive, isActive, onOpenReceiveDialog }: GoodsReceiptsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGoodsReceipts(poId, {
    enabled: isActive && !!poId,
  });

  const columns = useMemo<ColumnDef<GoodsReceiptData>[]>(
    () => [
      {
        accessorKey: 'grNumber',
        header: 'GR Number',
      },
      {
        accessorKey: 'receivedDate',
        header: 'Received Date',
        cell: ({ row }) => new Date(row.original.receivedDate).toLocaleDateString(),
      },
      {
        accessorKey: 'receivedBy',
        header: 'Received By',
        cell: ({ row }) => row.original.receivedBy ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        id: 'lineCount',
        header: 'Lines',
        cell: ({ row }) => row.original.items.length,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => row.original.notes ?? '—',
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
                onClick: () => navigate(`/goods-receipts/${buildSlug(row.original.grNumber, row.original.id)}`),
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
    slug: `commerce-purchase-order-${poId}-goods-receipts`,
    label: 'goods receipt',
    serverState: response,
    enableRowSelection: false,
    enableSorting: true,
    enableMultiSort: false,
    onStatePush: () => queryClient.invalidateQueries({ queryKey: GOODS_RECEIPTS_KEY(poId) }),
  });

  return (
    <DataTable
      table={table}
      mode="compact"
      isLoading={isLoading}
      toolbarActions={{
        actions: canReceive ? (
          <Button size="sm" onClick={onOpenReceiveDialog}>
            <PackageCheck className="mr-2 size-4" />
            Receive Goods
          </Button>
        ) : undefined,
      }}
      emptyStateConfig={{
        icon: PackageCheck,
        title: 'No goods receipts',
        description: canReceive ? 'Click "Receive Goods" to record a delivery.' : 'No goods receipts recorded yet.',
      }}
    />
  );
};
