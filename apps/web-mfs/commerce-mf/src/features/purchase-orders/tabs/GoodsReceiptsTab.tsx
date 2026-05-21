import { useQueryClient } from '@tanstack/react-query';
import { type ColumnDef, DataTable, RowActions, useDataTable } from '@vritti/quantum-ui/DataTable';
import { FormattedDate } from '@vritti/quantum-ui/FormattedDate';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Eye, PackageCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOODS_RECEIPTS_KEY } from '@/hooks/goods-receipts/keys';
import { useGoodsReceipts } from '@/hooks/goods-receipts/useGoodsReceipts';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';

interface GoodsReceiptsTabProps {
  poId: string;
  isActive: boolean;
}

export const GoodsReceiptsTab = ({ poId, isActive }: GoodsReceiptsTabProps) => {
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
        cell: ({ row }) => <FormattedDate value={row.original.receivedDate} dateFormat="P" />,
      },
      {
        accessorKey: 'receivedBy',
        header: 'Received By',
        cell: ({ row }) => row.original.receivedBy ?? '--',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => row.original.notes ?? '--',
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
      mode="tab"
      isLoading={isLoading}
      emptyStateConfig={{
        icon: PackageCheck,
        title: 'No goods receipts',
        description: 'Goods receipts linked to this purchase order will appear here.',
      }}
    />
  );
};
