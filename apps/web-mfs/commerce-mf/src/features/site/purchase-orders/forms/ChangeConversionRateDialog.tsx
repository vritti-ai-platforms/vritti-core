import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useSetPurchaseOrderConversionRate } from '@/hooks/site/purchase-orders';
import {
  type PurchaseOrderDetail,
  type SetPurchaseOrderConversionRateFormData,
  setPurchaseOrderConversionRateSchema,
} from '@/schemas/purchase-orders';
import { CurrencySelector } from '@/selectors/currency';

interface ChangeConversionRateDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes a rate the PO already has: every line priced in that currency is re-converted, and the total follows
export const ChangeConversionRateDialog: React.FC<ChangeConversionRateDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const currencies = Object.keys(purchaseOrder.conversionRates);
  const [first] = currencies;
  const form = useForm<SetPurchaseOrderConversionRateFormData>({
    resolver: zodResolver(setPurchaseOrderConversionRateSchema),
    defaultValues: { currencyCode: first, rate: Number(purchaseOrder.conversionRates[first]) },
  });
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });
  const mutation = useSetPurchaseOrderConversionRate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchaseOrder.id, currencyCode: data.currencyCode, rate: data.rate })}
    >
      <CurrencySelector
        name="currencyCode"
        includeCodes={currencies}
        disabled={currencies.length < 2}
        onOptionSelect={(option) => {
          const rate = option ? purchaseOrder.conversionRates[String(option.value)] : undefined;
          if (rate) form.setValue('rate', Number(rate));
        }}
      />
      <TextField
        name="rate"
        label={currencyCode ? `1 ${currencyCode} in ${purchaseOrder.currencyCode}` : 'Rate'}
        type="number"
        placeholder="e.g. 83.25"
        positive
        nonZero
        description={`Every ${currencyCode ?? ''} line on this PO is re-converted at it`}
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Rate
        </Button>
      </DialogActions>
    </Form>
  );
};
