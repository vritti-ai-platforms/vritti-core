import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateCustomerFormData, createCustomerSchema } from '@/schemas/customers';
import { useCreateCustomer } from '@/hooks/site/customers';

interface AddCustomerDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCustomerDialog: React.FC<AddCustomerDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  const createMutation = useCreateCustomer({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        notes: data.notes || undefined,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Customer Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Jane Doe" />
            <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
            <TextField name="email" label="Email" type="email" placeholder="e.g. jane@example.com" />
            <div className="sm:col-span-2">
              <TextArea name="notes" label="Notes" placeholder="Optional notes" />
            </div>
          </div>
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Customer
        </Button>
      </DialogActions>
    </Form>
  );
};
