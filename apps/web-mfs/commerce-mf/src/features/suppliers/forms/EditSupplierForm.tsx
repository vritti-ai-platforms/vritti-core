import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplier } from '@/hooks/useUpdateSupplier';
import { type SupplierDetail, type UpdateSupplierFormData, updateSupplierSchema } from '@/schemas/suppliers';

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
      address: supplier.address ?? '',
      gstin: supplier.gstin ?? '',
      paymentTerms: supplier.paymentTerms ?? '',
      leadTimeDays: supplier.leadTimeDays != null ? String(supplier.leadTimeDays) : '',
      notes: supplier.notes ?? '',
    },
  });

  const updateMutation = useUpdateSupplier({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: supplier.id,
        data: {
          ...data,
          leadTimeDays: data.leadTimeDays ? Number(data.leadTimeDays) : null,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Fresh Farms Ltd" />
      <TextField name="code" label="Code" placeholder="e.g. SUP-FRESH-001" />
      <TextArea name="address" label="Address" placeholder="Full postal address" />
      <div className="grid grid-cols-2 gap-4">
        <TextField name="gstin" label="GSTIN" placeholder="e.g. 29AABCT1332L1ZP" />
        <TextField name="paymentTerms" label="Payment Terms" placeholder="e.g. Net 30" />
      </div>
      <TextField name="leadTimeDays" label="Lead Time (days)" type="number" placeholder="e.g. 7" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
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
