import { Button } from '@vritti/quantum-ui/Button';
import { CompanySelector } from '@vritti/quantum-ui/CompanySelector';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSupplier } from '@/hooks/legal-entity/suppliers';
import { type CreateSupplierFormData, createSupplierSchema } from '@/schemas/suppliers';

interface AddSupplierDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      partyId: '',
      code: '',
      currencyCode: 'INR',
      paymentTerms: '',
      leadTimeDays: undefined,
      notes: '',
      isActive: true,
    },
  });

  const createMutation = useCreateSupplier({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        partyId: data.partyId,
        code: data.code,
        currencyCode: data.currencyCode,
        paymentTerms: data.paymentTerms || undefined,
        leadTimeDays: data.leadTimeDays ?? undefined,
        notes: data.notes || undefined,
        isActive: data.isActive,
      })}
    >
      <div className="space-y-6">
        <FormSection title="Company" contentClassName="block">
          <CompanySelector name="partyId" />
        </FormSection>

        <FormSection title="Commercial Terms" contentClassName="block">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="code" label="Code" placeholder="e.g. SUP-FRESH-001" />
            <CurrencySelector name="currencyCode" label="Currency" placeholder="Select currency" />
            <TextField name="paymentTerms" label="Payment Terms" placeholder="e.g. Net 30" />
            <TextField
              name="leadTimeDays"
              label="Lead Time (days)"
              type="number"
              placeholder="e.g. 7"
              integer
              positive
            />
            <div className="sm:col-span-2">
              <TextArea name="notes" label="Notes" placeholder="Optional notes" />
            </div>
            <Switch name="isActive" label="Active" description="Inactive suppliers are hidden from procurement" />
          </div>
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
