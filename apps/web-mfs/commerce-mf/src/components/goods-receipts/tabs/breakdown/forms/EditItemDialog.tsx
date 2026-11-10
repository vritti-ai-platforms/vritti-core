import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import type { DialogHandle } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { PackageCheck } from 'lucide-react';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  buildUpdateGoodsReceiptItemSchema,
  type GoodsReceiptItemData,
  type UpdateGoodsReceiptItemFormData,
} from '@/schemas/goods-receipts';
import type { GoodsReceiptsBinding } from '../../../bindings';
import { PurchaseOrderLineCounts } from './PurchaseOrderLineCounts';

interface EditItemFormProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  item: GoodsReceiptItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Recounts an item: what was received of its purchase order line and what of it was rejected
const EditItemForm: React.FC<EditItemFormProps> = ({ binding, goodsReceiptId, item, onSuccess, onCancel }) => {
  const schema = useMemo(
    () => buildUpdateGoodsReceiptItemSchema({ allowDecimal: item.uomAllowDecimal }),
    [item.uomAllowDecimal],
  );
  const form = useForm<UpdateGoodsReceiptItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: { receivedQty: item.receivedQty, rejectedQuantity: item.rejectedQuantity },
  });
  const mutation = binding.useUpdateItem(goodsReceiptId, item.id, { onSuccess });

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <PurchaseOrderLineCounts
        uomSymbol={item.uomSymbol}
        orderedQty={item.orderedQty}
        expectedFreeQty={item.expectedFreeQty}
        alreadyReceivedQty={item.alreadyReceivedQty}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          name="receivedQty"
          label="Received"
          description="Paid and free goods together"
          type="number"
          integer={!item.uomAllowDecimal}
          positive
        />
        <TextField
          name="rejectedQuantity"
          label="Rejected"
          description="Part of the received goods that arrived damaged or unusable"
          type="number"
          integer={!item.uomAllowDecimal}
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};

interface EditItemDialogProps {
  binding: GoodsReceiptsBinding;
  goodsReceiptId: string;
  item: GoodsReceiptItemData;
  handle: DialogHandle;
}

// The Edit Item dialog of a draft receipt
export const EditItemDialog: React.FC<EditItemDialogProps> = ({ binding, goodsReceiptId, item, handle }) => (
  <Dialog
    handle={handle}
    icon={PackageCheck}
    title="Edit Item"
    description={`Recount ${item.inventoryItemName} against its purchase order line.`}
    content={(close) => (
      <EditItemForm binding={binding} goodsReceiptId={goodsReceiptId} item={item} onSuccess={close} onCancel={close} />
    )}
  />
);
