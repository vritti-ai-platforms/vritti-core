import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSupplier } from '@/hooks/useCreateSupplier';
import { type CreateSupplierFormData, createSupplierSchema } from '@/schemas/suppliers';

interface AddSupplierDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      name: '',
      code: '',
      contactName: '',
      phone: '',
      alternateMobile: '',
      email: '',
      alternateEmail: '',
      designation: '',
      website: '',
      address: '',
      gstin: '',
      paymentTerms: '',
      leadTimeDays: '',
      notes: '',
    },
  });

  const createMutation = useCreateSupplier({
    onSuccess,
  });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        name: data.name,
        code: data.code,
        primaryContact: {
          name: data.contactName,
          phone: data.phone || undefined,
          alternateMobile: data.alternateMobile || undefined,
          email: data.email || undefined,
          alternateEmail: data.alternateEmail || undefined,
          designation: data.designation || undefined,
        },
        website: data.website || undefined,
        address: data.address || undefined,
        gstin: data.gstin || undefined,
        paymentTerms: data.paymentTerms || undefined,
        leadTimeDays: data.leadTimeDays ? Number(data.leadTimeDays) : undefined,
        notes: data.notes || undefined,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Supplier Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Fresh Farms Ltd" />
            <TextField name="code" label="Code" placeholder="e.g. SUP-FRESH-001" />
            <TextField name="website" label="Website" placeholder="e.g. https://freshfarms.com" />
            <TextField name="gstin" label="GSTIN" placeholder="e.g. 29AABCT1332L1ZP" />
            <TextField name="paymentTerms" label="Payment Terms" placeholder="e.g. Net 30" />
            <TextField name="leadTimeDays" label="Lead Time (days)" type="number" placeholder="e.g. 7" />
            <div className="sm:col-span-2">
              <TextArea name="address" label="Address" placeholder="Full postal address" />
            </div>
            <div className="sm:col-span-2">
              <TextArea name="notes" label="Notes" placeholder="Optional notes" />
            </div>
          </div>
        </FormSection>

        <FormSection title="Contact Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="contactName" label="Contact Name" placeholder="e.g. John Smith" />
            <TextField name="designation" label="Designation" placeholder="e.g. Procurement Manager" />
            <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
            <PhoneField name="alternateMobile" label="Alternate Mobile" placeholder="e.g. +91 98765 00000" />
            <TextField name="email" label="Email" type="email" placeholder="e.g. john@freshfarms.com" />
            <TextField
              name="alternateEmail"
              label="Alternate Email"
              type="email"
              placeholder="e.g. john.alt@freshfarms.com"
            />
          </div>
        </FormSection>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Supplier
        </Button>
      </div>
    </Form>
  );
};
