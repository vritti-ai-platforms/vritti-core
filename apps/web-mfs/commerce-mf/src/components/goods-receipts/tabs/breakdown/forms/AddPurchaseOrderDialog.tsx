import { Button } from '@vritti/quantum-ui/Button';
import { Dialog, DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import type { DialogHandle } from '@vritti/quantum-ui/hooks';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { ClipboardList } from 'lucide-react';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type AddGoodsReceiptPurchaseOrderFormData,
  addGoodsReceiptPurchaseOrderSchema,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';
import { ReceivablePurchaseOrderSelector } from '@/selectors/receivable-purchase-order';
import type { GoodsReceiptsBinding } from '../../../bindings';

interface AddPurchaseOrderFormProps {
  binding: GoodsReceiptsBinding;
  receipt: GoodsReceiptData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Picks another purchase order of the receipt's supplier at its site; every open line of it is added
const AddPurchaseOrderForm: React.FC<AddPurchaseOrderFormProps> = ({ binding, receipt, onSuccess, onCancel }) => {
  const form = useForm<AddGoodsReceiptPurchaseOrderFormData>({
    resolver: zodResolver(addGoodsReceiptPurchaseOrderSchema),
  });
  const mutation = binding.useAddPurchaseOrder(receipt.id, { onSuccess });

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
      <ReceivablePurchaseOrderSelector
        name="purchaseOrderId"
        supplierId={receipt.supplierId}
        goodsReceiptId={receipt.id}
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Purchase Order
        </Button>
      </DialogActions>
    </Form>
  );
};

interface AddPurchaseOrderDialogProps {
  binding: GoodsReceiptsBinding;
  receipt: GoodsReceiptData;
  handle: DialogHandle;
}

// The Add Purchase Order dialog of a draft receipt that created its own inbound delivery
export const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({ binding, receipt, handle }) => (
  <Dialog
    handle={handle}
    icon={ClipboardList}
    title="Add Purchase Order"
    description={`Every open line of the order is added to ${receipt.grNumber} and its inbound delivery ${receipt.deliveryNumber}, at its open quantity.`}
    content={(close) => <AddPurchaseOrderForm binding={binding} receipt={receipt} onSuccess={close} onCancel={close} />}
  />
);
