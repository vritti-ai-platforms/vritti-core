import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel } from '@vritti/quantum-ui/PageContent';
import { Plus, Tags, Trash2 } from 'lucide-react';
import { useRemoveStockAdjustmentLineItem, useStockAdjustmentLineItems } from '@/hooks/stock-adjustments';
import type { StockAdjustmentLineData } from '@/schemas/stock-adjustments';
import { PickSerialDialog } from '../../forms/change/PickSerialDialog';

interface ConsumeSerialsPanelProps {
  adjustmentId: string;
  line: StockAdjustmentLineData | null;
  isDraft: boolean;
  uomSymbol: string;
}

const PANEL_CLASSES = 'w-80 border-r-0 border-l';

export const ConsumeSerialsPanel = ({ adjustmentId, line, isDraft, uomSymbol }: ConsumeSerialsPanelProps) => {
  const confirm = useConfirm();
  const pickDialog = useDialog();
  const lineId = line?.id ?? null;

  const { data: serials = [] } = useStockAdjustmentLineItems(adjustmentId, lineId);
  const removeMutation = useRemoveStockAdjustmentLineItem(adjustmentId, lineId ?? '');

  const handleRemove = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'Remove this serial?',
      description: 'This serial will no longer be consumed by this line.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeMutation.mutate(itemId);
  };

  if (!line) {
    return (
      <PageContentPanel
        className={PANEL_CLASSES}
        header="Serials"
        contentClassName="flex items-center justify-center p-3"
        content={<Empty icon={<Tags />} title="No line selected" description="Pick a line to consume serials." />}
      />
    );
  }

  return (
    <>
      <PageContentPanel
        className={PANEL_CLASSES}
        header={
          <div>
            <div className="text-sm font-medium">Serials</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {serials.length} consumed
              {line.quantAvailableQuantity != null
                ? ` of ${line.quantAvailableQuantity} available ${uomSymbol}`
                : ''}
            </div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={pickDialog.open}>
              Pick
            </Button>
          ) : null
        }
        contentClassName={serials.length === 0 ? 'flex items-center justify-center p-3' : undefined}
        content={
          serials.length === 0 ? (
            <Empty icon={<Tags />} title="No serials picked" description="Pick a serial to consume." />
          ) : (
            <ul className="divide-y px-3">
              {serials.map((serial) => (
                <li key={serial.id} className="flex items-center justify-between py-2">
                  <span className="font-mono text-sm">{serial.serialNumber}</span>
                  {isDraft && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      startAdornment={<Trash2 className="size-3.5" />}
                      onClick={() => handleRemove(serial.id)}
                      isLoading={removeMutation.isPending && removeMutation.variables === serial.id}
                    >
                      Unpick
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )
        }
      />
      <PickSerialDialog adjustmentId={adjustmentId} lineId={lineId} handle={pickDialog} />
    </>
  );
};
