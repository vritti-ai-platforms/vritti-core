import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useChangeSupplierCurrency } from '@/hooks/legal-entity/suppliers';
import { type ChangeSupplierCurrencyFormData, changeSupplierCurrencySchema } from '@/schemas/suppliers';
import { CurrencySelector } from '@/selectors/currency';

interface ChangeCurrencyDialogProps {
  supplierId: string;
  currencyCode: string;
  currencyCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

// The currencies a supplier trades in and its default; prices stay in their own currencies, so one still used by the
// supplier's items, quotations or open purchase orders cannot be removed
export const ChangeCurrencyDialog: React.FC<ChangeCurrencyDialogProps> = ({
  supplierId,
  currencyCode,
  currencyCodes,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangeSupplierCurrencyFormData>({
    resolver: zodResolver(changeSupplierCurrencySchema),
    defaultValues: { currencyCodes, currencyCode },
  });

  const mutation = useChangeSupplierCurrency(supplierId, { onSuccess });
  const selectedCodes = useWatch({ control: form.control, name: 'currencyCodes' });
  const defaultCurrency = useWatch({ control: form.control, name: 'currencyCode' });

  // The default follows the list: dropping it falls back to the first currency left
  useEffect(() => {
    if (!selectedCodes?.length || selectedCodes.includes(defaultCurrency)) return;
    form.setValue('currencyCode', selectedCodes[0], { shouldValidate: true });
  }, [selectedCodes, defaultCurrency, form]);

  return (
    <Form form={form} mutation={mutation} onCancel={onCancel}>
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
        includeCodes={selectedCodes ?? []}
        disabled={!selectedCodes?.length}
        description="New items, quotations and purchase orders start in it"
      />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Currencies
        </Button>
      </DialogActions>
    </Form>
  );
};
