import { Button } from '@vritti/quantum-ui/Button';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { Typography } from '@vritti/quantum-ui/Typography';
import { ArrowRight } from 'lucide-react';
import type React from 'react';
import { OfferingVariantSelector } from '@/selectors/offering-variant';
import { useAddListingsWizard } from './AddListingsProvider';
import { WizardFooter } from './WizardFooter';

// Step two. The currency is asked here rather than beside the prices: the MRPs offered on the next step are
// the ones printed in it, so it has to be settled before those pickers open.
export const VariantsStep: React.FC = () => {
  const {
    catalogId,
    currencies,
    offeringId,
    variantIds,
    currencyCode,
    canAdvance,
    selectVariants,
    selectCurrency,
    rememberLabels,
    goNext,
  } = useAddListingsWizard();

  const handleVariantOptions = (options: SelectOption[]) =>
    rememberLabels(
      Object.fromEntries(
        options.map((option) => [String(option.value), { code: option.label, facets: option.description }]),
      ),
    );

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
        description="Pick as many as you like — each becomes a card on the next step."
      />

      {currencies.length > 0 ? (
        <Select
          label="Currency"
          value={currencyCode}
          onChange={(value: unknown) => selectCurrency(String(value ?? ''))}
          options={currencies.map((currency) => ({ value: currency.currencyCode, label: currency.currencyCode }))}
          description="One of the currencies this catalog carries. It decides which printed MRPs can be picked, and what the prices are in."
        />
      ) : (
        <Typography variant="body2" intent="muted">
          This catalog carries no currency yet, so these listings are added unpriced. Add one on the Prices tab.
        </Typography>
      )}

      <WizardFooter>
        <Button type="button" disabled={!canAdvance} endAdornment={<ArrowRight className="size-4" />} onClick={goNext}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
