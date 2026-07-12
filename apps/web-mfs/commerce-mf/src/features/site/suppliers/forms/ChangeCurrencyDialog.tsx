import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type ChangeSupplierCurrencyFormData, changeSupplierCurrencySchema } from '@/schemas/suppliers';
import { useChangeSupplierCurrency } from '@/hooks/site/suppliers';

interface ChangeCurrencyDialogProps {
  supplierId: string;
  currentCurrencyCode: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangeCurrencyDialog: React.FC<ChangeCurrencyDialogProps> = ({
  supplierId,
  currentCurrencyCode,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangeSupplierCurrencyFormData>({
    resolver: zodResolver(changeSupplierCurrencySchema),
    defaultValues: {
      currencyCode: '',
      conversionRate: NaN,
    },
  });

  const mutation = useChangeSupplierCurrency(supplierId, { onSuccess });
  const watchedCurrencyCode = useWatch({ control: form.control, name: 'currencyCode' });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        currencyCode: data.currencyCode,
        conversionRate: data.conversionRate,
      })}
    >
      <CurrencySelector
        name="currencyCode"
        label="New Currency"
        placeholder="Select currency"
        excludeCodes={[currentCurrencyCode]}
      />
      <TextField
        name="conversionRate"
        label={
          watchedCurrencyCode ? `Conversion Rate (${currentCurrencyCode} → ${watchedCurrencyCode})` : 'Conversion Rate'
        }
        type="number"
        placeholder="e.g. 1.25"
        positive
        nonZero
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Changing...">
          Change Currency
        </Button>
      </DialogActions>
    </Form>
  );
};
