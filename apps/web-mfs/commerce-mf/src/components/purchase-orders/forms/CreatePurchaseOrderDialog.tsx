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
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { buildCreatePurchaseOrderSchema, type CreatePurchaseOrderFormData } from '@/schemas/purchase-orders';
import { CurrencySelector } from '@/selectors/currency';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';
import type { PurchaseOrdersBinding } from '../bindings';

interface CreatePurchaseOrderDialogProps {
  binding: PurchaseOrdersBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

// Raises a draft order in one of the supplier's currencies; across the legal entity's sites, at a site the supplier is
// enrolled at
export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({
  binding,
  onSuccess,
  onCancel,
}) => {
  const SupplierSelector = binding.suppliers.Selector;
  const leCurrencyCode = useWorkspaceCurrency();
  const timeZone = useWorkspaceTimeZone();
  const schema = useMemo(
    () => buildCreatePurchaseOrderSchema({ requiresSite: binding.spansSites }),
    [binding.spansSites],
  );
  const today = isoTodayDate(timeZone);
  const form = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(schema),
    defaultValues: { exchangeRate: 1, orderDate: today, taxDate: today, notes: '' },
  });
  const createMutation = binding.useCreate({ onSuccess });

  const [supplierCurrencies, setSupplierCurrencies] = useState<string[]>([]);
  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const orderDate = useWatch({ control: form.control, name: 'orderDate' });
  const needsExchangeRate = !!currencyCode && currencyCode !== leCurrencyCode;

  // The tax date follows the order date until it is picked
  useEffect(() => {
    if (orderDate && !form.getFieldState('taxDate').isDirty) form.setValue('taxDate', orderDate);
  }, [orderDate, form]);

  // A new supplier offers its own currencies, starting from its default, and may not be enrolled at the site picked
  const handleSupplierSelect = (option: SelectOption | null) => {
    const codes = option?.additionals?.currencyCodes;
    const defaultCode = option?.additionals?.currencyCode;
    setSupplierCurrencies(Array.isArray(codes) ? codes.map(String) : []);
    if (typeof defaultCode === 'string') form.setValue('currencyCode', defaultCode, { shouldValidate: true });
    else form.resetField('currencyCode');
    form.resetField('siteId');
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
        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        orderDate: data.orderDate,
        taxDate: data.taxDate,
        notes: data.notes,
      })}
    >
      <FormSection
        title="Supplier"
        description={binding.spansSites ? 'The site must be one the supplier is enrolled at.' : undefined}
        contentClassName={binding.spansSites ? undefined : 'block'}
      >
        <SupplierSelector name="supplierId" onOptionSelect={handleSupplierSelect} />
        {binding.spansSites && <EnrolledSiteSelector name="siteId" supplierId={supplierId} />}
      </FormSection>

      <FormSection
        title="Currency"
        description={`Lines priced in the supplier's other currencies are converted into it.${
          needsExchangeRate ? ' The rate is editable until the first goods receipt of the order is published.' : ''
        }`}
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
          />
        )}
      </FormSection>

      <FormSection
        title="Dates"
        description="Every line follows the tax date unless set on the line; it may be before the order date."
      >
        <DatePicker name="orderDate" label="Order Date" />
        <DatePicker name="taxDate" label="Tax Date" />
      </FormSection>

      <FormSection title="Notes" contentClassName="block">
        <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase Order
        </Button>
      </DialogActions>
    </Form>
  );
};
