import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type SupplierInvoice,
  type SupplierInvoiceChargeLineFormData,
  type SupplierInvoiceChargeLinePayload,
  type SupplierInvoiceLine,
  supplierInvoiceChargeLineSchema,
} from '@/schemas/supplier-invoices';
import { CostCategorySelector } from '@/selectors/cost-category';
import type { SupplierInvoicesBinding } from '../bindings';

interface SupplierInvoiceChargeLineDialogProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoice;
  line?: SupplierInvoiceLine;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds a landed charge — freight, duty, insurance or a service — or edits one; posting spreads it over the stock the
// invoice's item lines cover, so an invoice with charges needs item lines too
export const SupplierInvoiceChargeLineDialog: React.FC<SupplierInvoiceChargeLineDialogProps> = ({
  binding,
  invoice,
  line,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SupplierInvoiceChargeLineFormData>({
    resolver: zodResolver(supplierInvoiceChargeLineSchema),
    defaultValues: line
      ? {
          costCategoryId: line.costCategoryId ?? undefined,
          unitPrice: line.unitPrice,
          discountAmount: line.discountAmount,
          taxAmount: line.taxAmount,
          description: line.description ?? '',
        }
      : { description: '' },
  });
  const addMutation = binding.useAddLine({ onSuccess });
  const updateMutation = binding.useUpdateLine({ onSuccess });

  // The schema has already required the amount by the time the form submits
  const toPayload = (data: SupplierInvoiceChargeLineFormData): SupplierInvoiceChargeLinePayload => ({
    lineType: 'CHARGE',
    costCategoryId: data.costCategoryId,
    unitPrice: data.unitPrice as CurrencyValue,
    discountAmount: data.discountAmount?.value ? data.discountAmount : undefined,
    taxAmount: data.taxAmount?.value ? data.taxAmount : undefined,
    description: data.description.trim() || undefined,
  });

  const body = (
    <>
      <div className="flex flex-col gap-6">
        <FormSection title="Charge">
          <CostCategorySelector
            name="costCategoryId"
            description="Any active category except the item price one"
            params={{ chargeOnly: true }}
          />
          <TextField name="description" label="Description (optional)" placeholder="e.g. Inward freight, Nov lot" />
        </FormSection>

        <FormSection title="Amounts">
          <CurrencyField name="unitPrice" label="Amount" currencyCode={invoice.currencyCode} />
          <CurrencyField name="discountAmount" label="Discount (optional)" currencyCode={invoice.currencyCode} />
          <CurrencyField name="taxAmount" label="Tax (optional)" currencyCode={invoice.currencyCode} />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {line ? 'Save Charge' : 'Add Charge'}
        </Button>
      </DialogActions>
    </>
  );

  return line ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ invoice, lineId: line.id, data: toPayload(data) })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ invoice, data: toPayload(data) })}
    >
      {body}
    </Form>
  );
};
