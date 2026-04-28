import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { format } from '@vritti/quantum-ui/date-fns';
import { Form } from '@vritti/quantum-ui/Form';
import { PurchaseOrderSelector } from '@vritti/quantum-ui/selects/purchase-order';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateGoodsReceipt } from '@/hooks/goods-receipts/useCreateGoodsReceipt';
import {
  type CreateGoodsReceiptFormData,
  createGoodsReceiptSchema,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';

interface CreateGoodsReceiptDialogProps {
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

export const CreateGoodsReceiptDialog: React.FC<CreateGoodsReceiptDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateGoodsReceiptFormData>({
    resolver: zodResolver(createGoodsReceiptSchema),
    defaultValues: {
      supplierId: '',
      purchaseOrderId: '',
      receivedDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    },
  });

  const createMutation = useCreateGoodsReceipt(null, {
    onSuccess: (data) => onSuccess(data),
  });
  const supplierId = form.watch('supplierId');

  useEffect(() => {
    form.setValue('purchaseOrderId', '');
  }, [form]);

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        purchaseOrderId: data.purchaseOrderId || undefined,
        receivedDate: data.receivedDate,
        notes: data.notes,
      })}
    >
      <SupplierSelector name="supplierId" label="Supplier" placeholder="Select supplier" />
      <PurchaseOrderSelector
        name="purchaseOrderId"
        label="Purchase Order (Optional)"
        placeholder="Select purchase order"
        disabled={!supplierId}
        params={
          supplierId
            ? { status: 'CONFIRMED,PARTIALLY_RECEIVED', supplierId }
            : { status: 'CONFIRMED,PARTIALLY_RECEIVED' }
        }
      />
      <TextField name="receivedDate" label="Received Date" type="date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </div>
    </Form>
  );
};
