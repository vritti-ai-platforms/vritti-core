import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { zodResolver } from '@vritti/quantum-ui/zod';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { type CatalogListingPricesFormShape, catalogListingPricesFormSchema } from '@/schemas/catalogs';
import { useAddListingsWizard } from './AddListingsProvider';
import { ListingVariantCard } from './ListingVariantCard';
import { WizardFooter } from './WizardFooter';

// Step three, and the only form in the wizard: one card per variant chosen, each holding the MRPs it is
// listed at and a price slot per MRP. Submitted as one batch, so a row the server refuses — already listed,
// or priced above its printed MRP — leaves the catalog as it was rather than half filled.
export const PricesStep: React.FC = () => {
  const { binding, catalogId, catalogName, currencyCode, variantIds, labels, dropVariant } = useAddListingsWizard();
  const navigate = useNavigate();

  // Seeded from what the steps before chose. One row per variant to begin with — picking MRPs on a card
  // replaces that row with one per MRP.
  const form = useForm<CatalogListingPricesFormShape>({
    resolver: zodResolver(catalogListingPricesFormSchema),
    defaultValues: {
      variants: variantIds.map((offeringVariantId) => ({
        offeringVariantId,
        mrpIds: [],
        rows: [{ inventoryItemMrpId: null }],
      })),
    },
  });
  const variants = useFieldArray({ control: form.control, name: 'variants' });
  const watched = useWatch({ control: form.control, name: 'variants' }) ?? [];

  const addMutation = binding.useAddListings({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const listingCount = watched.reduce((total, variant) => total + (variant?.rows?.length ?? 0), 0);
  const pricedCount = watched.reduce(
    (total, variant) => total + (variant?.rows ?? []).filter((row) => row?.price?.value).length,
    0,
  );

  // Dropping the card drops the variant from the wizard too, so going Back shows the picker agreeing with it
  const removeVariant = (offeringVariantId: string, index: number) => {
    variants.remove(index);
    dropVariant(offeringVariantId);
  };

  return (
    <Form
      form={form}
      mutation={addMutation}
      className="flex flex-col gap-4"
      transformSubmit={(data) => ({
        catalogId,
        items: data.variants.flatMap((variant) =>
          variant.rows.map((row) => ({
            offeringVariantId: variant.offeringVariantId,
            inventoryItemMrpId: row.inventoryItemMrpId,
            ...(row.price?.value && currencyCode ? { price: { currency: currencyCode, value: row.price.value } } : {}),
          })),
        ),
      })}
    >
      {variants.fields.map((field, index) => (
        <ListingVariantCard
          key={field.offeringVariantId}
          form={form}
          index={index}
          offeringVariantId={field.offeringVariantId}
          code={labels[field.offeringVariantId]?.code ?? field.offeringVariantId}
          facets={labels[field.offeringVariantId]?.facets}
          onRemove={() => removeVariant(field.offeringVariantId, index)}
        />
      ))}

      <WizardFooter
        summary={
          <div className="text-sm">
            <span className="font-mono font-semibold text-lg">{listingCount}</span>{' '}
            <span className="text-muted-foreground">
              {pluralize('listing', listingCount)} will be added to {catalogName}
            </span>
            <div className="text-muted-foreground text-xs">
              {`From ${pluralize('variant', variants.fields.length, true)} · ${pricedCount} of ${listingCount} given a price`}
            </div>
          </div>
        }
      >
        <Button
          type="submit"
          disabled={listingCount === 0}
          isLoading={addMutation.isPending}
          loadingText="Adding..."
          startAdornment={<Plus className="size-4" />}
        >
          {`Add ${pluralize('listing', listingCount, true)}`}
        </Button>
      </WizardFooter>
    </Form>
  );
};
