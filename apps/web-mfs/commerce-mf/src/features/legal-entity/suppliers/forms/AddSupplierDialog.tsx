import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateSupplier } from '@/hooks/legal-entity/suppliers';
import { type CreateSupplierFormData, createSupplierSchema } from '@/schemas/suppliers';
import { CompanySelector } from '@/selectors/company';
import { CurrencySelector } from '@/selectors/currency';
import { PaymentTermSelector } from '@/selectors/payment-term';

interface AddSupplierDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierDialog: React.FC<AddSupplierDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: {
      code: '',
      currencyCodes: ['INR'],
      currencyCode: 'INR',
      notes: '',
      purchasingBlocked: false,
      paymentBlocked: false,
      orderEmail: '',
      orderPhone: '',
      isActive: true,
    },
  });

  const createMutation = useCreateSupplier({ onSuccess });
  const currencyCodes = useWatch({ control: form.control, name: 'currencyCodes' });
  const defaultCurrency = useWatch({ control: form.control, name: 'currencyCode' });

  // The default follows the list: dropping it falls back to the first currency left
  useEffect(() => {
    if (!currencyCodes?.length || currencyCodes.includes(defaultCurrency)) return;
    form.setValue('currencyCode', currencyCodes[0], { shouldValidate: true });
  }, [currencyCodes, defaultCurrency, form]);

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
        currencyCodes: data.currencyCodes,
        defaultPaymentTermId: data.defaultPaymentTermId,
        notes: data.notes,
        purchasingBlocked: data.purchasingBlocked,
        paymentBlocked: data.paymentBlocked,
        orderEmail: data.orderEmail,
        orderPhone: data.orderPhone,
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
            <CurrencySelector
              name="currencyCodes"
              label="Currencies"
              placeholder="Select currencies"
              multiple
              description="Every currency this supplier quotes and invoices in"
            />
            <CurrencySelector
              name="currencyCode"
              label="Default Currency"
              includeCodes={currencyCodes ?? []}
              disabled={!currencyCodes?.length}
              description="New items, quotations and purchase orders start in it"
            />
            <PaymentTermSelector
              name="defaultPaymentTermId"
              label="Default Payment Term"
              description="Prefilled when a site enrolls this supplier"
            />
            <div className="sm:col-span-2">
              <TextArea name="notes" label="Notes" placeholder="Optional notes" />
            </div>
            <Switch name="isActive" label="Active" description="Inactive suppliers are hidden from procurement" />
          </div>
        </FormSection>

        <FormSection title="Ordering" contentClassName="block">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="orderEmail" label="Order Email" placeholder="e.g. orders@acme.com" />
            <TextField name="orderPhone" label="Order Phone" placeholder="e.g. +91 98765 43210" />
          </div>
        </FormSection>

        <FormSection title="Blocks" contentClassName="block">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Switch
              name="purchasingBlocked"
              label="Purchasing Blocked"
              description="Prevents new purchase orders to this supplier"
            />
            <Switch name="paymentBlocked" label="Payment Blocked" description="Prevents payments to this supplier" />
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
