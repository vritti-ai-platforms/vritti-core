import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type BulkSetListingPriceFormData, bulkSetListingPriceSchema } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';

interface BulkSetPriceDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  ids: string[];
  currencyCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const BulkSetPriceDialog: React.FC<BulkSetPriceDialogProps> = ({
  binding,
  catalogId,
  ids,
  currencyCodes,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<BulkSetListingPriceFormData>({
    resolver: zodResolver(bulkSetListingPriceSchema),
    // The only currency, when there is only one: a field with one option is a question with one answer.
    defaultValues: { currencyCode: currencyCodes[0] ?? '', price: { currency: currencyCodes[0] ?? '', value: '' } },
  });
  const currencyCode = useWatch({ control: form.control, name: 'currencyCode' });

  const setPriceMutation = binding.useBulkSetListingPrice({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setPriceMutation}
      transformSubmit={({ currencyCode: currency, price }) => ({
        catalogId,
        ids,
        price: { currency, value: price?.value ?? '' },
      })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <Select
          name="currencyCode"
          label="Currency"
          options={currencyCodes.map((code) => ({ value: code, label: code }))}
          description="One of the currencies this catalog carries."
        />
        <CurrencyField
          name="price"
          label="Price"
          currencyCode={currencyCode}
          description={`Applies to all ${pluralize('selected listing', ids.length, true)}. A listing keyed to a printed MRP refuses a price above it, and then none of them are priced.`}
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Pricing...">
          Set Price
        </Button>
      </DialogActions>
    </Form>
  );
};
