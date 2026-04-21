import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DateTimePicker } from '@vritti/quantum-ui/DateTimePicker';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { TextField } from '@vritti/quantum-ui/TextField';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePurchaseOrder } from '@/hooks/purchase-orders';
import { type CreatePurchaseOrderFormData, createPurchaseOrderSchema } from '@/schemas/purchase-orders';

interface CreatePurchaseOrderDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreatePurchaseOrderDialog: React.FC<CreatePurchaseOrderDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreatePurchaseOrderFormData>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      supplierId: '',
      supplierCurrencyCode: '',
      currencyCode: 'INR',
      conversionRate: '1',
      orderDate: new Date().toISOString().split('T')[0],
      expectedBy: '',
      notes: '',
    },
  });

  const orderDate = form.watch('orderDate');
  const poCurrencyCode = form.watch('currencyCode');
  const supplierCurrencyCode = form.watch('supplierCurrencyCode');
  const needsConversion = !!supplierCurrencyCode && poCurrencyCode !== supplierCurrencyCode;
  const minExpectedDate = orderDate ? parse(orderDate, 'yyyy-MM-dd', new Date()) : undefined;

  const createMutation = useCreatePurchaseOrder({ onSuccess });

  useEffect(() => {
    form.clearErrors('conversionRate');
    if (!needsConversion) {
      form.setValue('conversionRate', '1');
    }
  }, [needsConversion, form]);

  const handleSupplierSelect = (option: SelectOption | null) => {
    const rawCurrencyCode = option?.additionals?.currencyCode;
    const nextSupplierCurrencyCode = typeof rawCurrencyCode === 'string' ? rawCurrencyCode : '';
    form.setValue('supplierCurrencyCode', nextSupplierCurrencyCode);

    if (nextSupplierCurrencyCode) {
      form.setValue('currencyCode', nextSupplierCurrencyCode);
      form.setValue('conversionRate', '1');
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
        currencyCode: data.currencyCode,
        conversionRate: data.currencyCode === data.supplierCurrencyCode ? 1 : Number(data.conversionRate),
        orderDate: data.orderDate,
        expectedBy: data.expectedBy || undefined,
        notes: data.notes || undefined,
      })}
    >
      <SupplierSelector
        name="supplierId"
        label="Supplier"
        placeholder="Select supplier"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', additionalKeys: 'currencyCode' }}
        onOptionSelect={handleSupplierSelect}
      />
      <CurrencySelector name="currencyCode" label="PO Currency" placeholder="Select currency" />
      {needsConversion ? (
        <TextField
          name="conversionRate"
          label={`Conversion Rate (${supplierCurrencyCode} -> ${poCurrencyCode})`}
          type="number"
          placeholder="e.g. 83.250000"
        />
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
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Purchase Order
        </Button>
      </div>
    </Form>
  );
};
