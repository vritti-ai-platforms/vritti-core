import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type CatalogListingData,
  type SetCatalogListingPriceFormData,
  setCatalogListingPriceSchema,
} from '@/schemas/catalogs';
import type { CatalogsBinding } from '../bindings';

interface SetListingPriceDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  listing: CatalogListingData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetListingPriceDialog: React.FC<SetListingPriceDialogProps> = ({
  binding,
  catalogId,
  listing,
  onSuccess,
  onCancel,
}) => {
  const current = listing.prices.find((entry) => entry.siteId === null) ?? listing.prices[0];
  const form = useForm<SetCatalogListingPriceFormData>({
    resolver: zodResolver(setCatalogListingPriceSchema),
    defaultValues: { price: current?.price },
  });

  const setPriceMutation = binding.useSetListingPrice({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setPriceMutation}
      transformSubmit={({ price }) => ({ catalogId, listingId: listing.id, price })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <CurrencyField name="price" label="Price" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Price
        </Button>
      </DialogActions>
    </Form>
  );
};
