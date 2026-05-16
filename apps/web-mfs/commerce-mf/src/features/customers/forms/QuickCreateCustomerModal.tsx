import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCustomer } from '@/hooks/customers';
import { type CreateCustomerFormData, type CustomerData, createCustomerSchema } from '@/schemas/customers';

interface QuickCreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: CustomerData) => void;
  defaultName?: string;
  defaultPhone?: string;
}

export const QuickCreateCustomerModal: React.FC<QuickCreateCustomerModalProps> = ({
  open,
  onClose,
  onCreated,
  defaultName,
  defaultPhone,
}) => {
  // Pass onClose into the handle so dismissals (overlay click, Escape) propagate to the parent
  const handle = useDialog({ onClose });
  const wasOpenRef = useRef(false);

  // Sync controlled `open` prop into the dialog handle without re-firing onClose
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      handle.open();
      wasOpenRef.current = true;
    } else if (!open && wasOpenRef.current) {
      wasOpenRef.current = false;
    }
  }, [open, handle]);

  return (
    <Dialog
      handle={handle}
      title="Add Customer"
      description="Quickly create a customer for this sale."
      className="max-w-md"
      content={(close) => (
        <QuickCreateCustomerForm
          defaultName={defaultName}
          defaultPhone={defaultPhone}
          onCreated={(customer) => {
            onCreated(customer);
            close();
          }}
          onCancel={close}
        />
      )}
    />
  );
};

interface QuickCreateCustomerFormProps {
  onCreated: (customer: CustomerData) => void;
  onCancel: () => void;
  defaultName?: string;
  defaultPhone?: string;
}

const QuickCreateCustomerForm: React.FC<QuickCreateCustomerFormProps> = ({
  onCreated,
  onCancel,
  defaultName,
  defaultPhone,
}) => {
  const form = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: defaultName ?? '',
      phone: defaultPhone ?? '',
      email: '',
      notes: '',
    },
  });

  const createMutation = useCreateCustomer({
    onSuccess: (customer) => onCreated(customer),
  });

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
      })}
    >
      <div className="grid grid-cols-1 gap-4">
        <TextField name="name" label="Name" placeholder="e.g. Jane Doe" />
        <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
        <TextField name="email" label="Email" type="email" placeholder="Optional" />
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Customer
        </Button>
      </div>
    </Form>
  );
};
