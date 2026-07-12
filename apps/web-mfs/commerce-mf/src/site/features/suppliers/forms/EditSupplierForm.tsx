import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type SupplierDetail,
  TAX_ID_TYPE_OPTIONS,
  type UpdateSupplierFormData,
  updateSupplierSchema,
} from '@/schemas/suppliers';
import { useUpdateSupplier } from '@/site/hooks/suppliers';

interface EditSupplierFormProps {
  supplier: SupplierDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierForm: React.FC<EditSupplierFormProps> = ({ supplier, onSuccess, onCancel }) => {
  const form = useForm<UpdateSupplierFormData>({
    resolver: zodResolver(updateSupplierSchema),
    defaultValues: {
      name: supplier.name,
      code: supplier.code,
      currencyCode: supplier.currencyCode,
      website: supplier.website ?? '',
      address: supplier.address ?? '',
      taxId: supplier.taxId ?? '',
      taxIdType: supplier.taxIdType ?? null,
      paymentTerms: supplier.paymentTerms ?? '',
      leadTimeDays: supplier.leadTimeDays ?? undefined,
      notes: supplier.notes ?? '',
    },
  });

  const updateMutation = useUpdateSupplier({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => {
        return {
          id: supplier.id,
          data: {
            ...data,
            leadTimeDays: data.leadTimeDays ?? null,
          },
        };
      }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField name="name" label="Name" placeholder="e.g. Fresh Farms Ltd" />
        <TextField name="code" label="Code" placeholder="e.g. SUP-FRESH-001" />
        <TextField name="currencyCode" label="Currency" disabled />
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
        <TextArea name="address" label="Address" placeholder="Full postal address" rows={3} className="w-full" />
        <TextArea name="notes" label="Notes" placeholder="Optional notes" rows={3} className="w-full" />
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
