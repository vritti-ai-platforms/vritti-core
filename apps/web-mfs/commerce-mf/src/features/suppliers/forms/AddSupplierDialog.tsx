import { Button } from '@vritti/quantum-ui/Button';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Select } from '@vritti/quantum-ui/Select';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSupplier } from '@/hooks/suppliers';
import { type CreateSupplierFormData, createSupplierSchema, TAX_ID_TYPE_OPTIONS } from '@/schemas/suppliers';

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
      currencyCode: 'INR',
      contactName: '',
      phone: '',
      alternatePhone: '',
      email: '',
      alternateEmail: '',
      designation: '',
      website: '',
      address: '',
      taxId: '',
      taxIdType: undefined,
      paymentTerms: '',
      leadTimeDays: undefined,
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
        currencyCode: data.currencyCode,
        primaryContact: {
          name: data.contactName,
          phone: data.phone,
          alternatePhone: data.alternatePhone || undefined,
          email: data.email || undefined,
          alternateEmail: data.alternateEmail || undefined,
          designation: data.designation || undefined,
        },
        website: data.website || undefined,
        address: data.address || undefined,
        taxId: data.taxId?.trim() ? data.taxId.trim() : undefined,
        taxIdType: data.taxId?.trim() ? data.taxIdType || undefined : undefined,
        paymentTerms: data.paymentTerms || undefined,
        leadTimeDays: data.leadTimeDays ?? undefined,
        notes: data.notes || undefined,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Supplier Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="name" label="Name" placeholder="e.g. Fresh Farms Ltd" />
            <TextField name="code" label="Code" placeholder="e.g. SUP-FRESH-001" />
            <CurrencySelector name="currencyCode" label="Currency" placeholder="Select currency" />
            <TextField name="website" label="Website" placeholder="e.g. https://freshfarms.com" />
            <TextField name="taxId" label="Tax ID" placeholder="e.g. 29AABCT1332L1ZP" />
            <Select
              name="taxIdType"
              label="Tax ID Type"
              placeholder="Select type"
              options={TAX_ID_TYPE_OPTIONS}
              clearable
            />
            <TextField name="paymentTerms" label="Payment Terms" placeholder="e.g. Net 30" />
            <TextField name="leadTimeDays" label="Lead Time (days)" type="number" placeholder="e.g. 7" integer positive />
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
            <PhoneField name="alternatePhone" label="Alternate Phone" placeholder="e.g. +91 98765 00000" />
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
