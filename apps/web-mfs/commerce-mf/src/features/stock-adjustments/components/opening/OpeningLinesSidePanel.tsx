import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PageContentPanel, SidePanelListItem } from '@vritti/quantum-ui/PageContent';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { ClipboardList, Plus } from 'lucide-react';
import { useStockAdjustmentLinesTable } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { AddOpeningLineForm } from '../../forms/opening/AddOpeningLineForm';

interface OpeningLinesSidePanelProps {
  adjustment: StockAdjustmentData;
  isDraft: boolean;
  selectedLineId: string | null;
  onSelect: (lineId: string | null) => void;
}

export const OpeningLinesSidePanel = ({ adjustment, isDraft, selectedLineId, onSelect }: OpeningLinesSidePanelProps) => {
  const addLineDialog = useDialog();

  const { data: response, isLoading } = useStockAdjustmentLinesTable(adjustment.id);
  const lines = response?.result ?? [];

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
                <div className="text-sm font-medium truncate">
                  {line.locationName ?? line.locationId ?? '—'}
                </div>
                <span
                  className={`shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                    line.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                  }`}
                >
                  {line.lineItemsCount}/{line.quantity}
                </span>
              </div>
            </SidePanelListItem>
          ))}
        </div>
      </PageContentPanel>

      <Dialog
        handle={addLineDialog}
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
