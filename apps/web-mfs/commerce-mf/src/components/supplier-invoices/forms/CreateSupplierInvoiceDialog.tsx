import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  buildCreateSupplierInvoiceSchema,
  type CreateSupplierInvoiceFormData,
  type SupplierInvoice,
} from '@/schemas/supplier-invoices';
import { CurrencySelector } from '@/selectors/currency';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';
import type { SupplierInvoiceCreateBinding } from '../bindings';

interface CreateSupplierInvoiceDialogProps {
  binding: SupplierInvoiceCreateBinding;
  supplierId?: string;
  prefill?: { supplierId?: string; siteId?: string };
  onSuccess: (invoice: SupplierInvoice) => void;
  onCancel: () => void;
}

// Records a draft invoice header from a supplier — fixed when the list belongs to one — in one of its currencies;
// across the legal entity's sites, at a site the supplier is enrolled at. Its lines are entered on the invoice
export const CreateSupplierInvoiceDialog: React.FC<CreateSupplierInvoiceDialogProps> = ({
  binding,
  supplierId,
  prefill,
  onSuccess,
  onCancel,
}) => {
  const { SupplierSelector } = binding;
  const leCurrencyCode = useWorkspaceCurrency();
  const timeZone = useWorkspaceTimeZone();
  const schema = useMemo(
    () => buildCreateSupplierInvoiceSchema({ requiresSite: binding.spansSites, leCurrencyCode }),
    [binding.spansSites, leCurrencyCode],
  );
  const initialSupplierId = supplierId ?? prefill?.supplierId;
  const today = isoTodayDate(timeZone);
  const form = useForm<CreateSupplierInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierId: initialSupplierId,
      siteId: prefill?.siteId,
      invoiceNumber: '',
      invoiceDate: today,
      taxDate: today,
      notes: '',
    },
  });
  const createMutation = binding.useCreateInvoice({ onSuccess });

  const [supplierCurrencies, setSupplierCurrencies] = useState<string[]>([]);
  const lastSupplierIdRef = useRef(initialSupplierId);
  const pickedSupplierId = useWatch({ control: form.control, name: 'supplierId' });
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const invoiceDate = useWatch({ control: form.control, name: 'invoiceDate' });
  const needsExchangeRate = !!currencyCode && currencyCode !== leCurrencyCode;

  // The tax date follows the invoice date until it is picked
  useEffect(() => {
    if (invoiceDate && !form.getFieldState('taxDate').isDirty) form.setValue('taxDate', invoiceDate);
  }, [invoiceDate, form]);

  // The supplier offers its own currencies, starting from its default; picking another one clears the site, where the
  // new supplier may not be enrolled
  const handleSupplierSelect = (option: SelectOption | null) => {
    const codes = option?.additionals?.currencyCodes;
    const defaultCode = option?.additionals?.currencyCode;
    setSupplierCurrencies(Array.isArray(codes) ? codes.map(String) : []);
    const nextSupplierId = option ? String(option.value) : undefined;
    const changed = nextSupplierId !== lastSupplierIdRef.current;
    lastSupplierIdRef.current = nextSupplierId;
    if (changed) form.resetField('siteId');
    if (typeof defaultCode === 'string' && (changed || !form.getValues('currencyCode'))) {
      form.setValue('currencyCode', defaultCode, { shouldValidate: true });
    } else if (!option) {
      form.resetField('currencyCode');
    }
  };

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        siteId: data.siteId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        taxDate: data.taxDate,
        currencyCode: data.currencyCode,
        exchangeRate: data.currencyCode === leCurrencyCode ? undefined : data.exchangeRate,
        notes: data.notes || null,
      })}
    >
      <FormSection
        title="Supplier"
        description={binding.spansSites ? 'The site must be one the supplier is enrolled at.' : undefined}
        contentClassName={binding.spansSites ? undefined : 'block'}
      >
        <SupplierSelector
          name="supplierId"
          onOptionSelect={handleSupplierSelect}
          disabled={!!supplierId}
          disabledTip="The invoice is from the supplier this list belongs to"
        />
        {binding.spansSites && <EnrolledSiteSelector name="siteId" supplierId={pickedSupplierId} />}
      </FormSection>

      <FormSection title="Invoice">
        <TextField name="invoiceNumber" label="Invoice Number" placeholder="As printed by the supplier" />
        <DatePicker name="invoiceDate" label="Invoice Date" />
        <DatePicker name="taxDate" label="Tax Date" description="Follows the invoice date until changed" />
      </FormSection>

      <FormSection
        title="Currency"
        description="One of the supplier's currencies; every receipt the invoice covers must be on an order in it."
      >
        <CurrencySelector
          name="currencyCode"
          includeCodes={supplierCurrencies}
          disabled={supplierCurrencies.length < 2}
          disabledTip={
            supplierCurrencies.length
              ? `This supplier trades only in ${supplierCurrencies[0]}`
              : 'Select a supplier to choose from its currencies'
          }
          placeholder={supplierCurrencies.length ? 'Select currency' : 'Select a supplier first'}
        />
        {needsExchangeRate && (
          <TextField
            name="exchangeRate"
            label={`1 ${currencyCode} in ${leCurrencyCode}`}
            type="number"
            placeholder="e.g. 83.25"
            positive
            nonZero
            description="A rate other than an order's puts a hold on the lines on it"
          />
        )}
      </FormSection>

      <FormSection title="Notes" contentClassName="block">
        <TextArea name="notes" label="Notes (optional)" placeholder="e.g. Received with the second delivery" />
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Invoice
        </Button>
      </DialogActions>
    </Form>
  );
};
