import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ClipboardList, ClipboardMinus, Plus } from 'lucide-react';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { useStockAdjustmentLines } from '@/hooks/site/stock-adjustments';
import { AddOpeningLineForm } from '../../forms/opening/AddOpeningLineForm';

interface OpeningLinesSidePanelProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
  selectedLineId: string | null;
  onSelect: (lineId: string | null) => void;
}

export const OpeningLinesSidePanel = ({
  adjustment,
  isDraft,
  selectedLineId,
  onSelect,
}: OpeningLinesSidePanelProps) => {
  const addLineDialog = useDialog();

  const { data: lines = [], isLoading } = useStockAdjustmentLines(adjustment.id);

  return (
    <>
      <PageContentPanel
        className="w-80"
        header={
          <div className="space-y-1">
            <div className="text-sm font-semibold">Lines</div>
            <div className="text-xs text-muted-foreground">{pluralize('line', lines.length, true)}</div>
          </div>
        }
        actions={
          isDraft ? (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLineDialog.open}>
              Add Line
            </Button>
          ) : null
        }
        isLoading={isLoading}
        isEmpty={lines.length === 0}
        emptyState={
          <Empty
            icon={<ClipboardList />}
            title="No lines yet"
            description={isDraft ? 'Add a line to start filling serials.' : 'No lines in this adjustment.'}
            action={
              isDraft ? (
                <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addLineDialog.open}>
                  Add Line
                </Button>
              ) : undefined
            }
          />
        }
      >
        <div className="p-2 space-y-2">
          {lines.map((line) => (
            <SidePanelListItem key={line.id} active={selectedLineId === line.id} onClick={() => onSelect(line.id)}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium truncate">{line.locationName ?? line.locationId ?? '—'}</div>
                <Badge variant={line.isBalanced ? 'success' : 'warning'}>
                  {line.lineItemsCount}/{line.uomQty}
                </Badge>
              </div>
              {line.locationPath && (
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{line.locationPath}</div>
              )}
            </SidePanelListItem>
          ))}
        </div>
      </PageContentPanel>

      <Dialog
        handle={addLineDialog}
        icon={ClipboardMinus}
        title="Add Line"
        description="Pick a storage location for this line. Quantity is derived from the serials you add."
        content={(close) => (
          <AddOpeningLineForm
            adjustmentId={adjustment.id}
            inventoryItemId={adjustment.inventoryItemId}
            primaryUomId={adjustment.inventoryItemUomId}
            stockAdjustmentLotId={null}
            tracking="serial"
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
