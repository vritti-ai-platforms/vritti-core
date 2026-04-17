import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierContact } from '@/hooks/useAddSupplierContact';
import { createSupplierContactSchema, type CreateSupplierContactFormData } from '@/schemas/suppliers';

interface AddSupplierContactDialogProps {
  supplierId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierContactDialog: React.FC<AddSupplierContactDialogProps> = ({ supplierId, onSuccess, onCancel }) => {
  const form = useForm<CreateSupplierContactFormData>({
    resolver: zodResolver(createSupplierContactSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
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
        phone: data.phone || undefined,
        email: data.email || undefined,
        designation: data.designation || undefined,
        notes: data.notes || undefined,
        isPrimary: data.isPrimary,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. John Smith" />
      <TextField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
      <TextField name="email" label="Email" type="email" placeholder="e.g. john@supplier.com" />
      <TextField name="designation" label="Designation" placeholder="e.g. Procurement Manager" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <Switch name="isPrimary" label="Set as primary contact" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Contact
        </Button>
      </div>
    </Form>
  );
};
