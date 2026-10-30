import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DateTimePicker } from '@vritti/quantum-ui/DateTimePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePurchaseOrder } from '@/hooks/site/purchase-orders';
import { useSiteId } from '@/hooks/site/useSiteId';
import { type CreatePurchaseOrderFormData, createPurchaseOrderSchema } from '@/schemas/purchase-orders';
import { CurrencySelector } from '@/selectors/currency';
import { SupplierSelector } from '@/selectors/supplier';

interface CreatePurchaseOrderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EXCHANGE_RATE_TYPE_OPTIONS = [
  { label: 'Fixed (lock rate at PO time)', value: 'FIXED' },
  { label: 'Variable (resolve at GR/invoice)', value: 'VARIABLE' },
];

export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({ onSuccess, onCancel }) => {
  const buCurrencyCode = useBUCurrency();

  const siteId = useSiteId();
  const form = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      exchangeRateType: 'FIXED',
      exchangeRate: undefined,
      orderDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // The currencies of the chosen supplier; the PO is in one of them
  const [supplierCurrencies, setSupplierCurrencies] = useState<string[]>([]);
  const orderDate = form.watch('orderDate');
  const currencyCode = form.watch('currencyCode');
  const exchangeRateType = form.watch('exchangeRateType');
  const minExpectedDate = orderDate ? parse(orderDate, 'yyyy-MM-dd', new Date()) : undefined;
  const needsExchangeRate = !!currencyCode && !!buCurrencyCode && currencyCode !== buCurrencyCode;

  const createMutation = useCreatePurchaseOrder({ onSuccess });

  useEffect(() => {
    if (exchangeRateType === 'VARIABLE') {
      form.setValue('exchangeRate', undefined);
    }
  }, [exchangeRateType, form]);

  // A new supplier offers its own currencies, starting from its default
  const handleSupplierSelect = (option: SelectOption | null) => {
    const codes = option?.additionals?.currencyCodes;
    const defaultCode = option?.additionals?.currencyCode;
    setSupplierCurrencies(Array.isArray(codes) ? codes.map(String) : []);
    if (typeof defaultCode === 'string') form.setValue('currencyCode', defaultCode, { shouldValidate: true });
    else form.resetField('currencyCode');
  };

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        currencyCode: data.currencyCode,
        exchangeRateType: data.exchangeRateType,
        exchangeRate: data.exchangeRateType === 'FIXED' ? (data.exchangeRate ?? undefined) : null,
        orderDate: data.orderDate,
        expectedBy: data.expectedBy,
        notes: data.notes,
      })}
    >
      <SupplierSelector
        name="supplierId"
        params={{ siteId, enrollmentStatus: 'ENROLLED' }}
        onOptionSelect={handleSupplierSelect}
      />
      <CurrencySelector
        name="currencyCode"
        includeCodes={supplierCurrencies}
        disabled={supplierCurrencies.length < 2}
        placeholder={supplierCurrencies.length ? 'Select currency' : 'Select a supplier first'}
        description="Lines priced in the supplier's other currencies are converted into it"
      />
      {needsExchangeRate ? (
        <>
          <Select
            name="exchangeRateType"
            label="Exchange Rate Policy"
            description="FIXED locks the rate at PO time (auditable). VARIABLE defers to goods-receipt posting."
            options={EXCHANGE_RATE_TYPE_OPTIONS}
            clearable={false}
          />
          {exchangeRateType === 'FIXED' ? (
            <TextField
              name="exchangeRate"
              label={`Exchange Rate (${currencyCode} → ${buCurrencyCode})`}
              type="number"
              placeholder="e.g. 83.250000"
              positive
              nonZero
            />
          ) : null}
        </>
      ) : null}
      <DatePicker name="orderDate" label="Order Date" />
      <DateTimePicker
        name="expectedBy"
        label="Expected By"
        disabled={!orderDate}
        minDate={minExpectedDate}
        calendarProps={minExpectedDate ? { disabled: { before: minExpectedDate } } : undefined}
      />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase Order
        </Button>
      </DialogActions>
    </Form>
  );
};
