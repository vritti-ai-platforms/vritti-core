import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplierContact } from '@/hooks/suppliers';
import type { SupplierContactData, UpdateSupplierContactFormData } from '@/schemas/suppliers';
import { updateSupplierContactSchema } from '@/schemas/suppliers';

interface EditSupplierContactDialogProps {
  supplierId: string;
  contact: SupplierContactData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierContactDialog: React.FC<EditSupplierContactDialogProps> = ({
  supplierId,
  contact,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierContactFormData>({
    resolver: zodResolver(updateSupplierContactSchema),
    defaultValues: {
      name: contact.name,
      phone: contact.phone,
      alternatePhone: contact.alternatePhone ?? '',
      email: contact.email ?? '',
      alternateEmail: contact.alternateEmail ?? '',
      designation: contact.designation ?? '',
      notes: contact.notes ?? '',
      isActive: contact.isActive,
    },
  });

  const updateMutation = useUpdateSupplierContact(supplierId, contact.id, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        phone: data.phone,
        alternatePhone: data.alternatePhone || null,
        email: data.email || null,
        alternateEmail: data.alternateEmail || null,
        designation: data.designation || null,
        notes: data.notes || null,
        isActive: data.isActive,
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. John Smith" />
      <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
      <PhoneField name="alternatePhone" label="Alternate Phone" placeholder="e.g. +91 98765 00000" />
      <TextField name="email" label="Email" type="email" placeholder="e.g. john@supplier.com" />
      <TextField name="alternateEmail" label="Alternate Email" type="email" placeholder="e.g. john.alt@supplier.com" />
      <TextField name="designation" label="Designation" placeholder="e.g. Procurement Manager" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <Switch name="isActive" label="Active" description="Inactive contacts are hidden from POs and selectors" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
