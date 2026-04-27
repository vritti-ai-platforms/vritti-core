import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { useAddGoodsReceiptItem } from '@/hooks/goods-receipts';
import {
  type AddGoodsReceiptItemFormData,
  addGoodsReceiptItemSchema,
} from '@/schemas/goods-receipts';

// Build the params payload for the inventory-item select endpoint.
// poId takes precedence over supplierId at the gateway, and excludeIds is always allowed.
const buildSelectorParams = (
  excludeIds: string[],
  poId?: string | null,
  supplierId?: string | null,
): Record<string, string> | undefined => {
  const params: Record<string, string> = {};
  if (poId) params.poId = poId;
  else if (supplierId) params.supplierId = supplierId;
  if (excludeIds.length) params.excludeIds = excludeIds.join(',');
  return Object.keys(params).length ? params : undefined;
};

const AddItemForm = ({
  goodsReceiptId,
  excludeIds,
  poId,
  supplierId,
  onSuccess,
  onCancel,
}: {
  goodsReceiptId: string;
  excludeIds: string[];
  poId?: string | null;
  supplierId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const form = useForm<AddGoodsReceiptItemFormData>({
    resolver: zodResolver(addGoodsReceiptItemSchema),
    defaultValues: { inventoryItemId: '', rejectedQuantity: '' },
  });
  const mutation = useAddGoodsReceiptItem(goodsReceiptId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        rejectedQuantity: data.rejectedQuantity ? Number(data.rejectedQuantity) : undefined,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        params={buildSelectorParams(excludeIds, poId, supplierId)}
      />
      <TextField name="rejectedQuantity" label="Damaged on arrival (optional)" type="number" />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">Add Item</Button>
      </div>
    </Form>
  );
};

export const AddItemDialog = ({
  goodsReceiptId,
  excludeIds,
  poId,
  supplierId,
  handle,
}: {
  goodsReceiptId: string;
  excludeIds: string[];
  poId?: string | null;
  supplierId?: string | null;
  handle: ReturnType<typeof useDialog>;
}) => (
  <Dialog
    handle={handle}
    title="Add Item"
    description={
      poId
        ? 'Pick an inventory item from the linked purchase order.'
        : 'Pick an inventory item to receive on this goods receipt.'
    }
    content={(close) => (
      <AddItemForm
        goodsReceiptId={goodsReceiptId}
        excludeIds={excludeIds}
        poId={poId}
        supplierId={supplierId}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
