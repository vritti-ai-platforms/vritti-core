import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useGoodsReceiptBatchItems } from '@/hooks/goods-receipts/useGoodsReceiptBatchItems';
import { useRemoveGoodsReceiptBatchItem } from '@/hooks/goods-receipts/useGoodsReceiptMutations';
import type { GoodsReceiptBatchData } from '@/schemas/goods-receipts';
import { BatchItemEditorDialog } from '../forms/BatchItemEditorDialog';

export const GoodsReceiptBatchCard = ({
  id,
  itemId,
  batch,
  isDraft,
  onEdit,
  onRemove,
}: {
  id: string;
  itemId: string;
  batch: GoodsReceiptBatchData;
  isDraft: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) => {
  const confirm = useConfirm();
  const addItemDialog = useDialog();
  const editItemDialog = useDialog();
  const [editingItem, setEditingItem] = useState<{ id: string; serialNumber: string } | null>(null);
  const { data: items = [] } = useGoodsReceiptBatchItems(id, itemId, batch.id);
  const removeItemMutation = useRemoveGoodsReceiptBatchItem(id, itemId, batch.id);

  const handleRemoveItem = async (itemId: string) => {
    const confirmed = await confirm({
      title: 'Remove this line item?',
      description: 'This line item will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeItemMutation.mutate(itemId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{batch.inventoryItemName ?? batch.inventoryItemId}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{batch.locationName ?? batch.locationId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                batch.isBalanced ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
              }`}
            >
              {batch.batchItemsCount}/{batch.quantity}
            </span>
            {isDraft && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  startAdornment={<Pencil className="size-3.5" />}
                  onClick={onEdit}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={onRemove}
                  startAdornment={<Trash2 className="size-3.5" />}
                >
                  Remove
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>Quantity: {batch.quantity}</div>
          <div>
            Manufacturing: {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : '—'}
          </div>
          <div>Expiry: {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : '—'}</div>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Line Items</h4>
          {isDraft && (
            <Button size="sm" startAdornment={<Plus className="size-3.5" />} onClick={addItemDialog.open}>
              Add Line Item
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Quantity</th>
                  <th className="py-2 font-medium">Created</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.serialNumber}</td>
                    <td className="py-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-2">
                      {isDraft && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            startAdornment={<Pencil className="size-3.5" />}
                            onClick={() => {
                              setEditingItem({ id: item.id, serialNumber: item.serialNumber });
                              editItemDialog.open();
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            startAdornment={<Trash2 className="size-3.5" />}
                            isLoading={removeItemMutation.isPending}
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <BatchItemEditorDialog id={id} itemId={itemId} batchId={batch.id} handle={addItemDialog} />

      {editingItem && (
        <BatchItemEditorDialog
          id={id}
          itemId={itemId}
          batchId={batch.id}
          handle={editItemDialog}
          item={editingItem}
        />
      )}
    </Card>
  );
};
