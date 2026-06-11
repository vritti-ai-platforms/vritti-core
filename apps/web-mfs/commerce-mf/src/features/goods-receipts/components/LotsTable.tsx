import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Boxes, Eye, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useGoodsReceiptLots } from '@/hooks/goods-receipts';
import type { GoodsReceiptLotData } from '@/schemas/goods-receipts';
import { AddLotDialog } from '../forms/AddLotDialog';

interface LotsTableProps {
  goodsReceiptId: string;
  itemId: string;
  isDraft: boolean;
  uomSymbol: string | null;
  onSelectLot: (lotId: string) => void;
}

// Lots under a lot-tracked item. Reuses the lots list endpoint, adapted into DataTable server-state
// shape so we get the shared skeleton, empty state, and row interactions. Clicking a row (or the View
// action) drills into the lot, selecting it in the tree. Add is gated to draft receipts.
export const LotsTable = ({ goodsReceiptId, itemId, isDraft, uomSymbol, onSelectLot }: LotsTableProps) => {
  const addLotDialog = useDialog();

  const { data: lots = [], isLoading } = useGoodsReceiptLots(goodsReceiptId, itemId);

  const serverState = useMemo(() => ({ result: lots, count: lots.length }), [lots]);

  const columns = useMemo<ColumnDef<GoodsReceiptLotData>[]>(
    () => [
      {
        accessorKey: 'lotNumber',
        header: 'Lot',
        cell: ({ row }) => <span className="font-medium">{row.original.lotNumber}</span>,
      },
      {
        accessorKey: 'manufacturingDate',
        header: 'Manufactured',
        cell: ({ row }) => <DateCell value={row.original.manufacturingDate} />,
      },
      {
        accessorKey: 'expiryDate',
        header: 'Expires',
        cell: ({ row }) => <DateCell value={row.original.expiryDate} />,
      },
      {
        accessorKey: 'linesCount',
        header: 'Lines',
        cell: ({ row }) => <NumberCell value={row.original.linesCount} />,
      },
      {
        accessorKey: 'totalQuantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <span className="font-mono">
            <NumberCell value={row.original.totalQuantity} /> {uomSymbol ?? ''}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <RowActions
            actions={[{ id: 'view', icon: Eye, label: 'View', onClick: () => onSelectLot(row.original.id) }]}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [uomSymbol, onSelectLot],
  );

  const { table } = useDataTable({
    columns,
    serverState,
    slug: `gr-${goodsReceiptId}-item-${itemId}-lots`,
    label: 'lot',
    enableRowSelection: false,
  });

  return (
    <div className="space-y-3">
      <DataTable
        table={table}
        mode="compact"
        isLoading={isLoading}
        onRowClick={(row) => onSelectLot(row.id)}
        toolbarActions={
          isDraft
            ? {
                actions: (
                  <Button size="sm" startAdornment={<Plus className="size-4" />} onClick={addLotDialog.open}>
                    Add Lot
                  </Button>
                ),
              }
            : undefined
        }
        emptyStateConfig={{
          icon: Boxes,
          title: 'No lots yet',
          description: 'Add a lot to start receiving stock under this item.',
          action: isDraft ? (
            <Button startAdornment={<Plus className="size-4" />} onClick={addLotDialog.open}>
              Add Lot
            </Button>
          ) : undefined,
        }}
      />

      <AddLotDialog goodsReceiptId={goodsReceiptId} itemId={itemId} handle={addLotDialog} />
    </div>
  );
};
