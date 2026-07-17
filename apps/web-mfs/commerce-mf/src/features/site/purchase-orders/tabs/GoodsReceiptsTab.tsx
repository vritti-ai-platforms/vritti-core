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
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { GOODS_RECEIPTS_KEY } from '@/hooks/site/goods-receipts/keys';
import { useGoodsReceipts } from '@/hooks/site/goods-receipts/useGoodsReceipts';

interface GoodsReceiptsTabProps {
  poId: string;
}

export const GoodsReceiptsTab = ({ poId }: GoodsReceiptsTabProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: response, isLoading } = useGoodsReceipts(poId, {
    enabled: !!poId,
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
        cell: ({ row }) => <DateCell value={row.original.receivedDate} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
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
    slug: `commerce-site-purchase-order-${poId}-goods-receipts`,
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
