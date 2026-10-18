import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type BulkSetListingPriceFormData, bulkSetListingPriceSchema } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';

interface BulkSetPriceDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  ids: string[];
  // Set where the view already is one currency — the picker then has nothing to ask
  currencyCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PriceFormProps extends BulkSetPriceDialogProps {
  currencyCodes: string[];
}

// Fetched here rather than handed down: this picker is the only place the catalog's currencies are rendered
export const BulkSetPriceDialog: React.FC<BulkSetPriceDialogProps> = (props) => {
  const { data: currencies = [], isLoading } = props.binding.useCurrencies(props.catalogId);

  if (props.currencyCode) return <PriceForm {...props} currencyCodes={[props.currencyCode]} />;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return <PriceForm {...props} currencyCodes={currencies.map((currency) => currency.currencyCode)} />;
};

// Split out so the form mounts once the currencies are known — defaultValues are read on the first render only
const PriceForm: React.FC<PriceFormProps> = ({
  binding,
  catalogId,
  ids,
  currencyCodes,
  currencyCode: fixed,
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
          disabled={!!fixed}
          description={fixed ? 'Only prices in this currency change.' : 'The currency you are pricing in.'}
        />
        <CurrencyField
          name="price"
          label="Price"
          currencyCode={currencyCode}
          description={`Every one of the ${pluralize('listing', ids.length, true)} you selected gets this price. If any has a lower printed MRP, nothing is saved.`}
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
