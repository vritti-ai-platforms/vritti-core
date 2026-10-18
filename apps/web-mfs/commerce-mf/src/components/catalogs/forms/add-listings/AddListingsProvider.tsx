import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { CatalogsBinding } from '@/components/catalogs/bindings';
import type { CatalogCurrencyData } from '@/schemas/catalogs';
import { LISTING_WIZARD_STEPS, type ListingWizardStep } from './wizardSteps';

export interface VariantLabel {
  code: string;
  facets?: string;
}

export interface AddListingsWizard {
  binding: CatalogsBinding;
  catalogId: string;
  catalogName: string;
  currencies: CatalogCurrencyData[];

  step: ListingWizardStep;
  position: number;
  isLast: boolean;
  canAdvance: boolean;

  offeringId: string;
  offeringName: string;
  variantIds: string[];
  currencyCode?: string;
  labels: Record<string, VariantLabel>;

  selectOffering: (offeringId: string, offeringName: string) => void;
  selectVariants: (variantIds: string[]) => void;
  selectCurrency: (currencyCode: string) => void;
  rememberLabels: (entries: Record<string, VariantLabel>) => void;
  dropVariant: (offeringVariantId: string) => void;
  goNext: () => void;
  goBack: () => void;
}

const AddListingsContext = createContext<AddListingsWizard | undefined>(undefined);

interface AddListingsProviderProps {
  binding: CatalogsBinding;
  catalogId: string;
  catalogName: string;
  currencies: CatalogCurrencyData[];
  children: React.ReactNode;
}

// Owns the wizard's state, so every step reads it from here rather than through props
export const AddListingsProvider: React.FC<AddListingsProviderProps> = ({
  binding,
  catalogId,
  catalogName,
  currencies,
  children,
}) => {
  const [step, setStep] = useState<ListingWizardStep>('offering');
  const [offeringId, setOfferingId] = useState('');
  const [offeringName, setOfferingName] = useState('');
  const [variantIds, setVariantIds] = useState<string[]>([]);
  // The one currency, when there is only one: a field with one option is a question with one answer
  const [currencyCode, setCurrencyCode] = useState(currencies[0]?.currencyCode);
  const [labels, setLabels] = useState<Record<string, VariantLabel>>({});

  // A variant from the previous offering would be priced into a catalog its parent never reached
  const selectOffering = useCallback((id: string, name: string) => {
    setOfferingId(id);
    setOfferingName(name);
    setVariantIds([]);
  }, []);

  // Merged, never replaced: searching a picker reloads its options under a variant already carded
  const rememberLabels = useCallback(
    (entries: Record<string, VariantLabel>) => setLabels((previous) => ({ ...previous, ...entries })),
    [],
  );

  const dropVariant = useCallback(
    (offeringVariantId: string) => setVariantIds((current) => current.filter((id) => id !== offeringVariantId)),
    [],
  );

  const position = LISTING_WIZARD_STEPS.findIndex((entry) => entry.key === step) + 1;
  const isLast = position === LISTING_WIZARD_STEPS.length;

  const goNext = useCallback(() => setStep(LISTING_WIZARD_STEPS[position].key), [position]);
  const goBack = useCallback(() => setStep(LISTING_WIZARD_STEPS[position - 2].key), [position]);

  const value = useMemo<AddListingsWizard>(
    () => ({
      binding,
      catalogId,
      catalogName,
      currencies,
      step,
      position,
      isLast,
      canAdvance: step === 'offering' ? !!offeringId : variantIds.length > 0,
      offeringId,
      offeringName,
      variantIds,
      currencyCode,
      labels,
      selectOffering,
      selectVariants: setVariantIds,
      selectCurrency: setCurrencyCode,
      rememberLabels,
      dropVariant,
      goNext,
      goBack,
    }),
    [
      binding,
      catalogId,
      catalogName,
      currencies,
      step,
      position,
      isLast,
      offeringId,
      offeringName,
      variantIds,
      currencyCode,
      labels,
      selectOffering,
      rememberLabels,
      dropVariant,
      goNext,
      goBack,
    ],
  );

  return <AddListingsContext.Provider value={value}>{children}</AddListingsContext.Provider>;
};

// Reads the add-listings wizard; throws if used outside AddListingsProvider
export function useAddListingsWizard(): AddListingsWizard {
  const ctx = useContext(AddListingsContext);
  if (!ctx) {
    throw new Error('useAddListingsWizard must be used within an AddListingsProvider');
  }
  return ctx;
}
