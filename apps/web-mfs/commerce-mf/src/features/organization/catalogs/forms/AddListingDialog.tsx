import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Select } from '@vritti/quantum-ui/Select';
import { OfferingSelector } from '@vritti/quantum-ui/selects/offering';
import { OfferingVariantSelector } from '@vritti/quantum-ui/selects/offering-variant';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddCatalogListing, useCatalogListingMrpOptions } from '@/hooks/organization/catalogs';
import { type AddCatalogListingFormShape, addCatalogListingFormSchema } from '@/schemas/catalogs';

interface AddListingDialogProps {
  catalogId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddListingDialog: React.FC<AddListingDialogProps> = ({ catalogId, onSuccess, onCancel }) => {
  const fmt = useFormatters();
  const form = useForm<AddCatalogListingFormShape>({
    resolver: zodResolver(addCatalogListingFormSchema),
    defaultValues: { offeringId: '', offeringVariantId: '', inventoryItemMrpId: null, price: undefined },
  });

  // Variants only exist inside an offering, and MRP slices only inside a variant — each step unlocks the next
  const offeringId = useWatch({ control: form.control, name: 'offeringId' });
  const offeringVariantId = useWatch({ control: form.control, name: 'offeringVariantId' });
  const { data: mrpOptions = [], isLoading: mrpsLoading } = useCatalogListingMrpOptions(offeringVariantId || undefined);

  const addMutation = useAddCatalogListing({ onSuccess });

  const mrpChoices = mrpOptions.map((option) => ({
    value: option.id,
    label: `${fmt.currency(option.mrp).primary}${option.uomSymbol ? ` / ${option.uomSymbol}` : ''}`,
    description: option.isCurrent ? 'Currently printed' : 'Older stock',
  }));

  // A variant from the previous offering would query the wrong parent, and its MRP belongs to another item
  const handleOfferingChange = () => {
    form.setValue('offeringVariantId', '');
    form.setValue('inventoryItemMrpId', null);
  };

  const handleVariantChange = () => form.setValue('inventoryItemMrpId', null);

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      transformSubmit={({ offeringVariantId, inventoryItemMrpId, price }) => ({
        catalogId,
        offeringVariantId,
        inventoryItemMrpId,
        price,
      })}
      onCancel={onCancel}
    >
      <div className="space-y-4">
        <OfferingSelector name="offeringId" onOptionSelect={handleOfferingChange} />
        {/* The endpoint requires a real offeringId, so the variant selector only mounts once one is picked */}
        {offeringId ? (
          <OfferingVariantSelector
            key={offeringId}
            name="offeringVariantId"
            offeringId={offeringId}
            onOptionSelect={handleVariantChange}
          />
        ) : null}
        {offeringVariantId ? (
          <Select
            name="inventoryItemMrpId"
            label="MRP"
            placeholder={mrpChoices.length > 0 ? 'Any printed price' : 'No MRPs recorded for this variant'}
            options={mrpChoices}
            disabled={mrpsLoading || mrpChoices.length === 0}
            description="Leave empty to sell any batch. Pick one to list this variant at a single printed price — the same variant can be listed once per MRP."
          />
        ) : null}
        <CurrencyField
          name="price"
          label="Price"
          description="Optional. A listing keyed to an MRP cannot be priced above it."
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
