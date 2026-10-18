import { Button } from '@vritti/quantum-ui/Button';
import { pluralize } from '@vritti/quantum-ui/pluralize';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight, Plus } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { OfferingVariantSelector } from '@/selectors/offering-variant';
import { useAddListingsWizard } from './AddListingsProvider';
import { WizardFooter } from './WizardFooter';

// Step two — the currency is settled here because it decides which MRPs the next step offers. With no
// currency to settle there is no next step: the variants are listed for any batch, unpriced, from here.
export const VariantsStep: React.FC = () => {
  const {
    binding,
    catalogId,
    catalogName,
    currencies,
    canPrice,
    offeringId,
    variantIds,
    currencyCode,
    canAdvance,
    selectVariants,
    selectCurrency,
    rememberLabels,
    goNext,
  } = useAddListingsWizard();
  const navigate = useNavigate();

  const addMutation = binding.useAddListings({ onSuccess: () => navigate('..', { relative: 'path' }) });

  const handleVariantOptions = (options: SelectOption[]) =>
    rememberLabels(
      Object.fromEntries(
        options.map((option) => [String(option.value), { code: option.label, facets: option.description }]),
      ),
    );

  // One listing per variant, covering any batch — there is no currency to price them in and no MRP step
  const addUnpriced = () =>
    addMutation.mutate({
      catalogId,
      items: variantIds.map((offeringVariantId) => ({ offeringVariantId, inventoryItemMrpId: null })),
    });

  return (
    <>
      {/* Keyed on the offering, so switching offerings remounts the picker rather than showing the old
          page of options */}
      <OfferingVariantSelector
        key={offeringId}
        multiple
        label="Variants"
        value={variantIds}
        onChange={(values: unknown) => selectVariants((values as string[]) ?? [])}
        offeringId={offeringId}
        catalogId={catalogId}
        onOptionsSelect={handleVariantOptions}
        description={
          canPrice
            ? 'Choose as many as you want to sell. You set a price for each one next.'
            : 'Choose as many as you want to sell. Each goes in without a price for now.'
        }
      />

      {canPrice ? (
        <Select
          label="Currency"
          value={currencyCode}
          onChange={(value: unknown) => selectCurrency(String(value ?? ''))}
          options={currencies.map((currency) => ({ value: currency.currencyCode, label: currency.currencyCode }))}
          description="The currency you are pricing in. Only MRPs printed in it can be chosen."
        />
      ) : (
        <Typography variant="body2" intent="muted">
          This catalog carries no currency yet, so these listings are added unpriced. Add one on the Prices tab, then
          price them there.
        </Typography>
      )}

      <WizardFooter
        summary={
          canPrice ? undefined : (
            <div className="text-sm">
              <span className="font-mono font-semibold text-lg">{variantIds.length}</span>{' '}
              <span className="text-muted-foreground">
                {pluralize('listing', variantIds.length)} will be added to {catalogName}, unpriced
              </span>
            </div>
          )
        }
      >
        {canPrice ? (
          <Button
            type="button"
            disabled={!canAdvance}
            endAdornment={<ArrowRight className="size-4" />}
            onClick={goNext}
          >
            Next
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canAdvance}
            isLoading={addMutation.isPending}
            loadingText="Adding..."
            startAdornment={<Plus className="size-4" />}
            onClick={addUnpriced}
          >
            {`Add ${pluralize('listing', variantIds.length, true)}`}
          </Button>
        )}
      </WizardFooter>
    </>
  );
};
