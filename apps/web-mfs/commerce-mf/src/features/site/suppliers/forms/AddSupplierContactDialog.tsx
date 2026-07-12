import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { type CreateSupplierContactFormData, createSupplierContactSchema } from '@/schemas/suppliers';
import { useAddSupplierContact } from '@/hooks/site/suppliers';

interface AddSupplierContactDialogProps {
  supplierId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierContactDialog: React.FC<AddSupplierContactDialogProps> = ({
  supplierId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateSupplierContactFormData>({
    resolver: zodResolver(createSupplierContactSchema),
    defaultValues: {
      name: '',
      phone: '',
      alternatePhone: '',
      email: '',
      alternateEmail: '',
      designation: '',
      notes: '',
      isPrimary: false,
    },
  });

  const createMutation = useAddSupplierContact(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        phone: data.phone,
        alternatePhone: data.alternatePhone || undefined,
        email: data.email || undefined,
        alternateEmail: data.alternateEmail || undefined,
        designation: data.designation || undefined,
        notes: data.notes || undefined,
        isPrimary: data.isPrimary,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. John Smith" />
      <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
      <PhoneField name="alternatePhone" label="Alternate Phone" placeholder="e.g. +91 98765 00000" />
      <TextField name="email" label="Email" type="email" placeholder="e.g. john@supplier.com" />
      <TextField name="alternateEmail" label="Alternate Email" type="email" placeholder="e.g. john.alt@supplier.com" />
      <TextField name="designation" label="Designation" placeholder="e.g. Procurement Manager" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <Switch
        name="isPrimary"
        label="Set as primary contact"
        description="Used as the default contact when sending POs"
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Contact
        </Button>
      </DialogActions>
    </Form>
  );
};
