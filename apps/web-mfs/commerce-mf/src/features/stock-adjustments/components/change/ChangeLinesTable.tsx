import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { ClipboardList, Pencil, Trash2 } from 'lucide-react';
import type { InventoryTracking, StockAdjustmentLineData } from '@/schemas/stock-adjustments';

interface ChangeLinesTableProps {
  lines: StockAdjustmentLineData[];
  tracking: InventoryTracking;
  isDraft: boolean;
  uomSymbol: string;
  selectedLineId?: string | null;
  onSelect?: (line: StockAdjustmentLineData) => void;
  onEdit: (line: StockAdjustmentLineData) => void;
  onRemove: (line: StockAdjustmentLineData) => void;
  removingLineId?: string | null;
}

const formatQuant = (line: StockAdjustmentLineData): string => {
  const lot = line.quantLotNumber ? `${line.quantLotNumber} @ ` : '';
  return `${lot}${line.quantLocationName ?? line.quantLocationId ?? '—'}`;
};

export const ChangeLinesTable = ({
  lines,
  tracking,
  isDraft,
  uomSymbol,
  selectedLineId,
  onSelect,
  onEdit,
  onRemove,
  removingLineId,
}: ChangeLinesTableProps) => {
  if (lines.length === 0) {
    return <Empty icon={<ClipboardList />} title="No lines yet" description="Pick a quant to start." />;
  }

  const isItem = tracking === 'serial';

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Quant (Lot @ Location)</th>
            <th className="px-3 py-2 font-medium">Available</th>
            <th className="px-3 py-2 font-medium">Quantity</th>
            {isItem && <th className="px-3 py-2 font-medium">Serials</th>}
            {isDraft && <th className="px-3 py-2 font-medium text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const isSelected = selectedLineId === line.id;
            return (
              <tr
                key={line.id}
                className={`border-b last:border-0 ${onSelect ? 'cursor-pointer' : ''} ${
                  isSelected ? 'bg-accent/50' : 'hover:bg-muted/30'
                }`}
                onClick={onSelect ? () => onSelect(line) : undefined}
              >
                <td className="px-3 py-2">{formatQuant(line)}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {line.quantAvailableQuantity ?? '—'} {uomSymbol}
                </td>
                <td className="px-3 py-2">
                  {line.quantity} {uomSymbol}
                </td>
                {isItem && (
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        line.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {line.lineItemsCount}/{line.quantity}
                    </span>
                  </td>
                )}
                {isDraft && (
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(line);
                        }}
                        startAdornment={<Pencil className="size-3.5" />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(line);
                        }}
                        isLoading={removingLineId === line.id}
                        startAdornment={<Trash2 className="size-3.5" />}
                      >
                        Remove
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
