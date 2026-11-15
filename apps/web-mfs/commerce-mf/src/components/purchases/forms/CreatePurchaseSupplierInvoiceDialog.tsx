import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency, useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { SupplierInvoiceLink } from '@/components/supplier-invoices/types';
import { buildPurchaseSupplierInvoiceSchema, type PurchaseSupplierInvoiceFormData } from '@/schemas/purchases';
import { CurrencySelector } from '@/selectors/currency';
import type { PurchasesBinding } from '../bindings';

interface CreatePurchaseSupplierInvoiceDialogProps {
  binding: PurchasesBinding;
  // The site invoiced at, where the session has none
  siteId?: string;
  // The supplier of the leg being invoiced; picked in the dialog otherwise
  supplier?: { supplierId: string; supplierName: string };
  // Only these purchases are invoiced; every open leg of the supplier at the site otherwise
  purchaseIds?: string[];
  onSuccess: (invoice: SupplierInvoiceLink) => void;
  onCancel: () => void;
}

// Drafts the supplier's invoice with a line for every posted receipt still to invoice — at the order price, for
// the quantity accepted — so it only needs checking against the paper invoice and posting in the supplier's invoices
export const CreatePurchaseSupplierInvoiceDialog: React.FC<CreatePurchaseSupplierInvoiceDialogProps> = ({
  binding,
  siteId,
  supplier,
  purchaseIds,
  onSuccess,
  onCancel,
}) => {
  const { SupplierSelector } = binding;
  const leCurrencyCode = useWorkspaceCurrency();
  const timeZone = useWorkspaceTimeZone();
  const schema = useMemo(() => buildPurchaseSupplierInvoiceSchema({ leCurrencyCode }), [leCurrencyCode]);
  const today = isoTodayDate(timeZone);
  const form = useForm<PurchaseSupplierInvoiceFormData>({
    resolver: zodResolver(schema),
    defaultValues: { supplierId: supplier?.supplierId, invoiceNumber: '', invoiceDate: today, taxDate: today },
  });
  const [supplierCurrencies, setSupplierCurrencies] = useState<string[]>([]);
  const supplierNameRef = useRef(supplier?.supplierName ?? '');
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const invoiceDate = useWatch({ control: form.control, name: 'invoiceDate' });
  const needsExchangeRate = !!currencyCode && currencyCode !== leCurrencyCode;
  const createMutation = binding.useCreateSupplierInvoice({
    onSuccess: (response, variables) =>
      onSuccess({
        id: response.data.supplierInvoiceId,
        invoiceNumber: variables.invoiceNumber,
        supplierId: variables.supplierId,
        supplierName: supplierNameRef.current,
      }),
  });

  // The tax date follows the invoice date until it is picked
  useEffect(() => {
    if (invoiceDate && !form.getFieldState('taxDate').isDirty) form.setValue('taxDate', invoiceDate);
  }, [invoiceDate, form]);

  // The supplier offers its own currencies, starting from its default
  const handleSupplierSelect = (option: SelectOption | null) => {
    const codes = option?.additionals?.currencyCodes;
    const defaultCode = option?.additionals?.currencyCode;
    supplierNameRef.current = option?.label ?? '';
    setSupplierCurrencies(Array.isArray(codes) ? codes.map(String) : []);
    if (typeof defaultCode === 'string') form.setValue('currencyCode', defaultCode, { shouldValidate: true });
    else form.resetField('currencyCode');
  };

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId,
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        taxDate: data.taxDate,
        currencyCode: data.currencyCode,
        exchangeRate: needsExchangeRate ? data.exchangeRate : undefined,
        purchaseIds,
      })}
    >
      <FormSection title="Supplier" contentClassName="block">
        <SupplierSelector
          name="supplierId"
          params={siteId ? binding.supplierParams?.(siteId) : undefined}
          onOptionSelect={handleSupplierSelect}
          disabled={!!supplier}
          disabledTip="The invoice is from this supplier"
          description={
            purchaseIds
              ? 'Invoices what this purchase has received from the supplier and not yet invoiced'
              : "Invoices what the supplier's open purchases at the site have received and not yet invoiced"
          }
        />
      </FormSection>

      <FormSection title="Invoice">
        <TextField name="invoiceNumber" label="Invoice Number" placeholder="As printed by the supplier" />
        <DatePicker name="invoiceDate" label="Invoice Date" />
        <DatePicker name="taxDate" label="Tax Date" description="Follows the invoice date until changed" />
      </FormSection>

      <FormSection title="Currency" description="One of the supplier's currencies">
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
          />
        )}
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Drafting...">
          Draft Supplier Invoice
        </Button>
      </DialogActions>
    </Form>
  );
};
