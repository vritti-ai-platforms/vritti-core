import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { Boxes, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { useStockAdjustmentLots } from '@/hooks/stock-adjustments';
import type { StockAdjustmentLotData } from '@/schemas/stock-adjustments';
import { AddLotDialog } from '../../forms/opening/AddLotDialog';

interface LotSidePanelProps {
  adjustmentId: string;
  isDraft: boolean;
  uomSymbol: string;
  selectedLotId: string | null;
  onSelectLot: (lotId: string | null) => void;
}

export const LotSidePanel = ({
  adjustmentId,
  isDraft,
  uomSymbol,
  selectedLotId,
  onSelectLot,
}: LotSidePanelProps) => {
  const { data: lots = [] } = useStockAdjustmentLots(adjustmentId);
  const addLotDialog = useDialog();

  useEffect(() => {
    if (!selectedLotId && lots.length > 0) onSelectLot(lots[0].id);
    if (selectedLotId && !lots.some((lot) => lot.id === selectedLotId)) onSelectLot(lots[0]?.id ?? null);
  }, [lots, selectedLotId, onSelectLot]);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Lots</div>
            <div className="text-xs text-muted-foreground">
              {lots.length} {lots.length === 1 ? 'lot' : 'lots'}
            </div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLotDialog.open}>
              Add Lot
            </Button>
          ) : null
        }
        contentClassName={lots.length === 0 ? 'flex items-center justify-center p-3' : undefined}
        content={
          lots.length === 0 ? (
            <Empty
              icon={<Boxes />}
              title="No lots"
              description={isDraft ? 'Add the first lot to begin distributing.' : 'No lots in this adjustment.'}
            />
          ) : (
            <div className="p-2 space-y-2">
              {lots.map((lot: StockAdjustmentLotData) => (
                <SidePanelListItem
                  key={lot.id}
                  active={selectedLotId === lot.id}
                  onClick={() => onSelectLot(lot.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium truncate">{lot.lotNumber}</div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        lot.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                      }`}
                    >
                      {lot.totalQuantity} {uomSymbol}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {lot.linesCount} {lot.linesCount === 1 ? 'line' : 'lines'}
                    {lot.expiryDate ? ` • exp ${new Date(lot.expiryDate).toLocaleDateString()}` : ''}
                  </div>
                </SidePanelListItem>
              ))}
            </div>
          )
        }
      />

      <AddLotDialog adjustmentId={adjustmentId} handle={addLotDialog} />
    </>
  );
};
