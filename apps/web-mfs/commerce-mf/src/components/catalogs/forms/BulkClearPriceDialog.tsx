import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select } from '@vritti/quantum-ui/Select';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { Typography } from '@vritti/quantum-ui/Typography';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type BulkClearListingPricesFormData, bulkClearListingPricesSchema } from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';

interface BulkClearPriceDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  ids: string[];
  // Set where the view already is one currency — the picker then has nothing to ask
  currencyCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BulkClearPriceDialog: React.FC<BulkClearPriceDialogProps> = ({
  binding,
  catalogId,
  ids,
  currencyCode,
  onSuccess,
  onCancel,
}) => {
  const { data: currencies = [], isLoading } = binding.useCurrencies(catalogId);
  const form = useForm<BulkClearListingPricesFormData>({
    resolver: zodResolver(bulkClearListingPricesSchema),
    defaultValues: { currencyCodes: currencyCode ? [currencyCode] : [] },
  });
  const selected = useWatch({ control: form.control, name: 'currencyCodes' }) ?? [];
  const clearMutation = binding.useBulkClearListingPrices({ onSuccess });

  // Only the options wait on the fetch — the defaults never do, so the form can mount either way
  if (!currencyCode && isLoading) {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const codes = currencyCode ? [currencyCode] : currencies.map((currency) => currency.currencyCode);

  return (
    <Form
      form={form}
      mutation={clearMutation}
      transformSubmit={({ currencyCodes }) => ({ catalogId, ids, currencyCodes })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <Select
          name="currencyCodes"
          multiple
          label="Currencies"
          placeholder="Choose currencies"
          options={codes.map((code) => ({ value: code, label: code }))}
          disabled={!!currencyCode || codes.length === 0}
          description={
            currencyCode
              ? 'Only prices in this currency are removed.'
              : 'Prices in the currencies you choose are removed. The rest stay as they are.'
          }
        />
        <Typography variant="body2" intent="muted">
          {`Removes your ${selected.join(', ') || 'chosen'} ${pluralize('price', selected.length)} from ${pluralize('listing', ids.length, true)}. If a wider workspace prices them, that price applies again — otherwise they go unpriced until you set a new one.`}
        </Typography>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" loadingText="Removing...">
          {`Remove ${pluralize('Price', selected.length, true)}`}
        </Button>
      </DialogActions>
    </Form>
  );
};
