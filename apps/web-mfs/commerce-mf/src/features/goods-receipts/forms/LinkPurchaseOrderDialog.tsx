import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { PurchaseOrderSelector } from '@vritti/quantum-ui/selects/purchase-order';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useLinkGoodsReceiptPurchaseOrder } from '@/hooks/goods-receipts';
import {
  type GoodsReceiptData,
  type LinkGoodsReceiptPurchaseOrderFormData,
  linkGoodsReceiptPurchaseOrderSchema,
} from '@/schemas/goods-receipts';

interface LinkPurchaseOrderDialogProps {
  goodsReceipt: GoodsReceiptData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LinkPurchaseOrderDialog: React.FC<LinkPurchaseOrderDialogProps> = ({
  goodsReceipt,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<LinkGoodsReceiptPurchaseOrderFormData>({
    resolver: zodResolver(linkGoodsReceiptPurchaseOrderSchema),
    defaultValues: { purchaseOrderId: '' },
  });
  const mutation = useLinkGoodsReceiptPurchaseOrder(goodsReceipt.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({ purchaseOrderId: data.purchaseOrderId })}
    >
      <PurchaseOrderSelector
        name="purchaseOrderId"
        label="Purchase Order"
        placeholder="Select purchase order"
        params={{ status: 'CONFIRMED,PARTIALLY_RECEIVED', supplierId: goodsReceipt.supplierId }}
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Linking...">
          Link Purchase Order
        </Button>
      </DialogActions>
    </Form>
  );
};
