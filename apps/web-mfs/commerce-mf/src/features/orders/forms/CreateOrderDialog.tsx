import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateOrder } from '@/hooks/orders';
import { type CreateOrderFormData, createOrderSchema } from '@/schemas/orders';

interface CreateOrderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const orderTypeOptions = [
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'DELIVERY', label: 'Delivery' },
];

const channelOptions = [
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'ONLINE', label: 'Online' },
];

export const CreateOrderDialog: React.FC<CreateOrderDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      type: 'DINE_IN',
      channel: 'WALK_IN',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      notes: '',
      serviceCharge: undefined,
      deliveryCharge: undefined,
      discountAmount: undefined,
    },
  });

  const createMutation = useCreateOrder({ onSuccess });
  const orderType = form.watch('type');

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        type: data.type,
        channel: data.channel,
        customerName: data.customerName || undefined,
        customerPhone: data.customerPhone || undefined,
        deliveryAddress: data.deliveryAddress || undefined,
        notes: data.notes || undefined,
        serviceCharge: data.serviceCharge,
        deliveryCharge: data.deliveryCharge,
        discountAmount: data.discountAmount,
      })}
    >
      <RadioGroup name="type" label="Order Type" options={orderTypeOptions} orientation="horizontal" />
      <RadioGroup name="channel" label="Channel" options={channelOptions} orientation="horizontal" />
      <TextField name="customerName" label="Customer Name" placeholder="Optional" />
      <TextField name="customerPhone" label="Customer Phone" placeholder="Optional" />
      {orderType === 'DELIVERY' && (
        <TextArea name="deliveryAddress" label="Delivery Address" placeholder="Full delivery address" />
      )}
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="grid grid-cols-3 gap-3">
        <TextField name="serviceCharge" label="Service Charge" type="number" placeholder="0" />
        <TextField name="deliveryCharge" label="Delivery Charge" type="number" placeholder="0" />
        <TextField name="discountAmount" label="Discount" type="number" placeholder="0" />
      </div>
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
