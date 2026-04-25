import { Button } from '@vritti/quantum-ui/Button';
import { Empty } from '@vritti/quantum-ui/Empty';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGoodsReceiptBatches } from '@/hooks/goods-receipts/useGoodsReceiptBatches';
import { useGoodsReceiptItem } from '@/hooks/goods-receipts/useGoodsReceiptLine';
import {
  useRemoveGoodsReceiptBatch,
} from '@/hooks/goods-receipts/useGoodsReceiptMutations';
import { useRemoveGoodsReceiptItem } from '@/hooks/goods-receipts/useRemoveGoodsReceiptLine';
import type { GoodsReceiptBatchData } from '@/schemas/goods-receipts';
import { BatchEditorDialog } from '../forms/BatchEditorDialog';
import { GoodsReceiptBatchCard } from './GoodsReceiptBatchCard';

export const GoodsReceiptAllocationContent = ({
  id,
  selectedLineId,
  isDraft,
  onSelectLine,
}: {
  id: string;
  selectedLineId: string | null;
  isDraft: boolean;
  onSelectLine: (itemId: string | null) => void;
}) => {
  const confirm = useConfirm();
  const addBatchDialog = useDialog();
  const editBatchDialog = useDialog();
  const [editingBatch, setEditingBatch] = useState<GoodsReceiptBatchData | null>(null);

  const { data: selectedLine } = useGoodsReceiptItem(id, selectedLineId);
  const { data: batches = [] } = useGoodsReceiptBatches(id, selectedLineId);
  const removeLineMutation = useRemoveGoodsReceiptItem(id);
  const removeBatchMutation = useRemoveGoodsReceiptBatch(id, selectedLineId ?? '');

  const handleRemoveLine = async () => {
    if (!selectedLine) return;
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and all batch details will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) {
      removeLineMutation.mutate(selectedLine.id, { onSuccess: () => onSelectLine(null) });
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    const confirmed = await confirm({
      title: 'Remove this batch?',
      description: 'This batch and its line items will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeBatchMutation.mutate(batchId);
  };

  if (!selectedLine) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty icon={<ClipboardList />} title="No line selected" description="Select a line from the left panel." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{selectedLine.inventoryItemName ?? selectedLine.inventoryItemId}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Accepted {selectedLine.acceptedQuantity} • Rejected {selectedLine.rejectedQuantity}
          </p>
        </div>
        {isDraft && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={addBatchDialog.open} startAdornment={<Plus className="size-3.5" />}>
              Add Batch
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleRemoveLine}
              isLoading={removeLineMutation.isPending}
              startAdornment={<Trash2 className="size-3.5" />}
            >
              Remove Line
            </Button>
          </div>
        )}
      </div>

      {batches.length === 0 ? (
        <Empty icon={<ClipboardList />} title="No batches" description="Add a batch for this line." />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <GoodsReceiptBatchCard
              key={batch.id}
              id={id}
              itemId={selectedLine.id}
              batch={batch}
              isDraft={isDraft}
              onEdit={() => {
                setEditingBatch(batch);
                editBatchDialog.open();
              }}
              onRemove={() => handleRemoveBatch(batch.id)}
            />
          ))}
        </div>
      )}

      <BatchEditorDialog
        id={id}
        itemId={selectedLine.id}
        handle={addBatchDialog}
        defaultInventoryItemId={selectedLine.inventoryItemId}
      />

      {editingBatch && (
        <BatchEditorDialog
          id={id}
          itemId={selectedLine.id}
          handle={editBatchDialog}
          batch={editingBatch}
        />
      )}
    </div>
  );
};
