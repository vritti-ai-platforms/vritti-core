import { Button } from '@vritti/quantum-ui/Button';
import {
  type ColumnDef,
  CurrencyCell,
  DataTable,
  DateCell,
  NumberCell,
  RowActions,
  useDataTable,
} from '@vritti/quantum-ui/DataTable';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { Boxes, Eye, Plus } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import type { GoodsReceiptLotData } from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../bindings';
import { AddLotDialog } from './forms/AddLotDialog';

interface LotsTableProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  itemId: string;
  isDraft: boolean;
  uomSymbol: string;
  onSelectLot: (lotId: string) => void;
}

// The lots of a lot-tracked item; a row opens the lot
export const LotsTable: React.FC<LotsTableProps> = ({
  binding,
  goodsReceiptId,
  itemId,
  isDraft,
  uomSymbol,
  onSelectLot,
}) => {
  const addLotDialog = useDialog();
  const { data: lots = [], isLoading } = binding.useLots(goodsReceiptId, itemId);
  const lotRows = useMemo(() => ({ result: lots, count: lots.length }), [lots]);

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
        accessorKey: 'mrp',
        header: 'MRP',
        cell: ({ row }) => <CurrencyCell value={row.original.mrp} />,
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
            <NumberCell value={row.original.totalQuantity} /> {uomSymbol}
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

  const lotsTable = useDataTable({
    columns,
    query: { data: lotRows, isLoading },
    slug: `goods-receipt-${goodsReceiptId}-item-${itemId}-lots`,
    label: 'lot',
    enableRowSelection: false,
  });

  const addLotAction = isDraft && (
    <Button
      size="sm"
      permission={binding.permissions.edit}
      startAdornment={<Plus className="size-4" />}
      onClick={addLotDialog.open}
    >
      Add Lot
    </Button>
  );

  return (
    <div className="space-y-3">
      <DataTable
        table={lotsTable}
        mode="compact"
        permission={binding.permissions.view}
        onRowClick={(lot) => onSelectLot(lot.id)}
        toolbarActions={{ actions: addLotAction }}
        emptyStateConfig={{
          icon: Boxes,
          title: 'No lots yet',
          description: 'Add a lot to start receiving stock under this item.',
          action: addLotAction,
        }}
      />

      <AddLotDialog binding={binding} goodsReceiptId={goodsReceiptId} itemId={itemId} handle={addLotDialog} />
    </div>
  );
};
