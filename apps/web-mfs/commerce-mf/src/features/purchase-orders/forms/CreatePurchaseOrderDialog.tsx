import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DateTimePicker } from '@vritti/quantum-ui/DateTimePicker';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form } from '@vritti/quantum-ui/Form';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { TextArea } from '@vritti/quantum-ui/TextArea';
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
      expectedBy: '',
      notes: '',
    },
  });

  const orderDate = form.watch('orderDate');
  const minExpectedDate = orderDate ? parse(orderDate, 'yyyy-MM-dd', new Date()) : undefined;

  const createMutation = useCreatePurchaseOrder({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        expectedBy: data.expectedBy || undefined,
        notes: data.notes || undefined,
      })}
    >
      <SupplierSelector name="supplierId" label="Supplier" placeholder="Select supplier" />
      <DatePicker name="orderDate" label="Order Date" />
      <DateTimePicker
        name="expectedBy"
        label="Expected By"
        disabled={!orderDate}
        minDate={minExpectedDate}
        calendarProps={minExpectedDate ? { disabled: { before: minExpectedDate } } : undefined}
      />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase Order
        </Button>
      </div>
    </Form>
  );
};
