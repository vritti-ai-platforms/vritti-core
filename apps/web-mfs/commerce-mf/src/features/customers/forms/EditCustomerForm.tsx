import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateCustomer } from '@/hooks/customers';
import { type CustomerDetail, type UpdateCustomerFormData, updateCustomerSchema } from '@/schemas/customers';

interface EditCustomerFormProps {
  customer: CustomerDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCustomerForm: React.FC<EditCustomerFormProps> = ({ customer, onSuccess, onCancel }) => {
  const form = useForm<UpdateCustomerFormData>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      notes: customer.notes ?? '',
    },
  });

  const updateMutation = useUpdateCustomer({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: customer.id,
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: data.notes || null,
        },
      })}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField name="name" label="Name" placeholder="e.g. Jane Doe" />
        <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
        <TextField name="email" label="Email" type="email" placeholder="e.g. jane@example.com" />
        <TextArea name="notes" label="Notes" placeholder="Optional notes" rows={3} className="sm:col-span-2 w-full" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
