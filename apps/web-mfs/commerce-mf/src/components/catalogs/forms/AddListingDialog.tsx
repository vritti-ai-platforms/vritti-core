import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Skeleton } from '@vritti/quantum-ui/Skeleton';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type AddCatalogListingFormShape, addCatalogListingFormSchema } from '@/schemas/catalogs';
import { InventoryItemMrpSelector } from '@/selectors/inventory-item-mrp';
import { OfferingSelector } from '@/selectors/offering';
import { OfferingVariantSelector } from '@/selectors/offering-variant';
import type { CatalogsBinding } from '../bindings';

interface AddListingDialogProps {
  binding: CatalogsBinding;
  catalogId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface AddListingFormProps extends AddListingDialogProps {
  currencyCodes: string[];
}

// One variant, listed here and now. The wizard does the same thing for a whole offering at once, so both
// post the same batch endpoint — this one with a single item.
export const AddListingDialog: React.FC<AddListingDialogProps> = (props) => {
  const { data: currencies = [], isLoading } = props.binding.useCurrencies(props.catalogId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-6 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return <AddListingForm {...props} currencyCodes={currencies.map((currency) => currency.currencyCode)} />;
};

// Split out so the form mounts once the currencies are known — defaultValues are read on the first render only
const AddListingForm: React.FC<AddListingFormProps> = ({ binding, catalogId, currencyCodes, onSuccess, onCancel }) => {
  const form = useForm<AddCatalogListingFormShape>({
    resolver: zodResolver(addCatalogListingFormSchema),
  });
  const offeringId = useWatch({ control: form.control, name: 'offeringId' });
  const offeringVariantId = useWatch({ control: form.control, name: 'offeringVariantId' });
  const price = useWatch({ control: form.control, name: 'price' });
  const currencyCode = price?.currency ?? currencyCodes[0];

  const addMutation = binding.useAddListings({ onSuccess });

  // A variant from the previous offering would be priced into a catalog its parent never reached
  const handleOfferingChange = () => {
    form.resetField('offeringVariantId');
    form.resetField('inventoryItemMrpId');
  };

  const handleVariantChange = () => form.resetField('inventoryItemMrpId');

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      transformSubmit={(data) => ({
        catalogId,
        items: [
          {
            offeringVariantId: data.offeringVariantId,
            inventoryItemMrpId: data.inventoryItemMrpId ?? null,
            ...(data.price?.value ? { price: { currency: data.price.currency, value: data.price.value } } : {}),
          },
        ],
      })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <OfferingSelector name="offeringId" catalogId={catalogId} onOptionSelect={handleOfferingChange} />

        {/* Disabled rather than hidden until its parent is chosen — the form never changes shape, and a
            disabled Select cannot open, which is what its options are fetched on */}
        <OfferingVariantSelector
          key={offeringId}
          name="offeringVariantId"
          offeringId={offeringId}
          catalogId={catalogId}
          disabled={!offeringId}
          onOptionSelect={handleVariantChange}
          description={offeringId ? undefined : 'Choose an offering first.'}
        />

        <InventoryItemMrpSelector
          key={`${offeringVariantId}:${currencyCode}`}
          name="inventoryItemMrpId"
          label="MRP"
          variantId={offeringVariantId}
          currencyCode={currencyCode}
          catalogId={catalogId}
          clearable
          disabled={!offeringVariantId}
          description={
            offeringVariantId
              ? 'Leave empty to sell every batch at one price, or choose a printed MRP to sell only that one.'
              : 'Choose a variant first.'
          }
        />

        <CurrencyField
          name="price"
          label="Price"
          currencies={currencyCodes}
          defaultCurrencyCode={currencyCodes[0]}
          disabled={currencyCodes.length === 0}
          disabledTip="This catalog carries no currency yet. Add one on the Prices tab."
          description="Leave blank to price it later. Only MRPs printed in its currency can be chosen, and it cannot be more than the MRP."
        />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Listing
        </Button>
      </DialogActions>
    </Form>
  );
};
