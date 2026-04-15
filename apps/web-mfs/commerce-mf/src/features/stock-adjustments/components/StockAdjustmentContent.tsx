import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@vritti/quantum-ui/Card';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Empty } from '@vritti/quantum-ui/Empty';
import { Form } from '@vritti/quantum-ui/Form';
import { useConfirm, useDialog } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Badge } from '@vritti/quantum-ui/Badge';
import { MapPin, Pencil, Plus, Trash2, ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useRemoveStockAdjustmentLine,
  useRemoveStockAdjustmentLineItem,
  useStockAdjustmentLineItems,
  useStockAdjustmentLines,
  useUpdateStockAdjustmentLine,
} from '@/hooks/stock-adjustments';
import type { StockAdjustmentData, StockAdjustmentLineData, StockAdjustmentLineItemData } from '@/schemas/stock-adjustments';
import { AddLineItemDialogForm } from '../forms/AddLineItemDialogForm';
import { EditLineItemDialogForm } from '../forms/EditLineItemDialogForm';

const lineSchema = z.object({
  quantity: z.string().min(1, 'Quantity is required'),
  locationId: z.string().optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
});
type LineFormData = z.infer<typeof lineSchema>;

interface LineFormProps {
  adjustmentId: string;
  line: StockAdjustmentLineData;
  isOpeningStock: boolean;
  isDraft: boolean;
}

const LineForm = ({ adjustmentId, line, isOpeningStock, isDraft }: LineFormProps) => {
  const form = useForm<LineFormData>({
    resolver: zodResolver(lineSchema),
    defaultValues: {
      quantity: String(line.quantity),
      locationId: line.locationId ?? '',
      manufacturingDate: line.manufacturingDate ?? '',
      expiryDate: line.expiryDate ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      quantity: String(line.quantity),
      locationId: line.locationId ?? '',
      manufacturingDate: line.manufacturingDate ?? '',
      expiryDate: line.expiryDate ?? '',
    });
  }, [line, form]);

  const updateMutation = useUpdateStockAdjustmentLine(adjustmentId, line.id);

  if (!isDraft) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Quantity</p>
          <p className="font-medium mt-1">{line.quantity}</p>
        </div>
        {isOpeningStock && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Mfg Date</p>
              <p className="font-medium mt-1">{line.manufacturingDate ?? '—'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiry Date</p>
              <p className="font-medium mt-1">{line.expiryDate ?? '—'}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      transformSubmit={(data) => ({
        quantity: Number(data.quantity),
        ...(isOpeningStock
          ? {
              locationId: data.locationId || undefined,
              manufacturingDate: data.manufacturingDate || undefined,
              expiryDate: data.expiryDate || undefined,
            }
          : {}),
      })}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextField name="quantity" label="Quantity" type="number" />
        <TextField
          name="locationId"
          label={isOpeningStock ? 'Location ID' : 'Location ID (Read only for non-opening)'}
          disabled={!isOpeningStock}
        />
        {isOpeningStock && (
          <>
            <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
            <TextField name="expiryDate" label="Expiry Date" type="date" />
          </>
        )}
      </div>
      <div className="pt-3">
        <Button type="submit" size="sm" startAdornment={<Pencil className="size-3.5" />}>
          Save Line
        </Button>
      </div>
    </Form>
  );
};

interface StockAdjustmentContentProps {
  adjustment: StockAdjustmentData;
  selectedLineId: string | null;
  isDraft: boolean;
  isOpeningStock: boolean;
}

export const StockAdjustmentContent = ({
  adjustment,
  selectedLineId,
  isDraft,
  isOpeningStock,
}: StockAdjustmentContentProps) => {
  const confirm = useConfirm();
  const addLineItemDialog = useDialog();
  const editLineItemDialog = useDialog();
  const [editingItem, setEditingItem] = useState<StockAdjustmentLineItemData | null>(null);

  const { data: lines = [] } = useStockAdjustmentLines(adjustment.id);
  const selectedLine = useMemo(
    () => lines.find((line) => line.id === selectedLineId) ?? lines[0] ?? null,
    [lines, selectedLineId],
  );
  const { data: lineItems = [], isLoading: isLoadingLineItems } = useStockAdjustmentLineItems(
    adjustment.id,
    selectedLine?.id ?? null,
  );

  const removeLineMutation = useRemoveStockAdjustmentLine(adjustment.id);
  const removeLineItemMutation = useRemoveStockAdjustmentLineItem(adjustment.id, selectedLine?.id ?? '');

  async function handleRemoveLine(lineId: string) {
    const confirmed = await confirm({
      title: 'Remove this line?',
      description: 'This line and its line items will be removed from the adjustment.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLineMutation.mutate(lineId);
  }

  async function handleRemoveLineItem(itemId: string) {
    const confirmed = await confirm({
      title: 'Remove this line item?',
      description: 'This line item will be removed.',
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) removeLineItemMutation.mutate(itemId);
  }

  return (
    <div className="flex-1 overflow-auto p-6 min-w-0 flex flex-col">
      {selectedLine ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold">Line</h3>
              <Badge variant={selectedLine.isLineItemsBalanced ? 'secondary' : 'destructive'}>
                {selectedLine.isLineItemsBalanced ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  startAdornment={<Trash2 className="size-3.5" />}
                  onClick={() => handleRemoveLine(selectedLine.id)}
                >
                  Remove Line
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <LineForm
                adjustmentId={adjustment.id}
                line={selectedLine}
                isOpeningStock={isOpeningStock}
                isDraft={Boolean(isDraft)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Line Items ({lineItems.length})</CardTitle>
                {isDraft && (
                  <Button size="sm" onClick={addLineItemDialog.open} startAdornment={<Plus className="size-4" />}>
                    Add Line Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingLineItems ? (
                <div className="text-sm text-muted-foreground">Loading line items…</div>
              ) : lineItems.length === 0 ? (
                <Empty
                  icon={<MapPin />}
                  title="No line items"
                  description="Add line items. Their sum must match line quantity to publish."
                  className="py-8"
                />
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-left">
                        <th className="px-3 py-2 font-medium">Quantity</th>
                        <th className="px-3 py-2 font-medium">Created</th>
                        <th className="px-3 py-2 font-medium w-40">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">{new Date(item.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {isDraft && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    editLineItemDialog.open();
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                              {isDraft && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveLineItem(item.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="h-full">
          {isDraft ? (
            <Empty
              icon={<ClipboardList />}
              title="No line selected"
              description="Create or select a line from the left panel."
              className="h-full"
            />
          ) : (
            <Empty icon={<ClipboardList />} title="No lines" description="This adjustment has no lines." className="h-full" />
          )}
        </div>
      )}

      {selectedLine && (
        <Dialog
          handle={addLineItemDialog}
          title="Add Line Item"
          description="Add a quantity entry for this line."
          content={(close) => (
            <AddLineItemDialogForm
              adjustmentId={adjustment.id}
              lineId={selectedLine.id}
              onSuccess={close}
              onCancel={close}
            />
          )}
        />
      )}

      {selectedLine && editingItem && (
        <Dialog
          handle={editLineItemDialog}
          title="Edit Line Item"
          description="Update this line item quantity."
          content={(close) => (
            <EditLineItemDialogForm
              adjustmentId={adjustment.id}
              lineId={selectedLine.id}
              itemId={editingItem.id}
              defaultQuantity={editingItem.quantity}
              onSuccess={() => {
                setEditingItem(null);
                close();
              }}
              onCancel={() => {
                setEditingItem(null);
                close();
              }}
            />
          )}
        />
      )}
    </div>
  );
};
