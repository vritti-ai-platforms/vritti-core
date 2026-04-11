import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePurchaseOrder } from '@/hooks/useCreatePurchaseOrder';
import { type CreatePurchaseOrderFormData, createPurchaseOrderSchema } from '@/schemas/purchase-orders';

interface CreatePurchaseOrderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: '',
      notes: '',
    },
  });

  const createMutation = useCreatePurchaseOrder({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        expectedDate: data.expectedDate || undefined,
        notes: data.notes || undefined,
      })}
    >
      <SupplierSelector name="supplierId" label="Supplier" placeholder="Select supplier" />
      <TextField name="orderDate" label="Order Date" type="date" />
      <TextField name="expectedDate" label="Expected Delivery Date" type="date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Order
        </Button>
      </div>
    </Form>
  );
};
