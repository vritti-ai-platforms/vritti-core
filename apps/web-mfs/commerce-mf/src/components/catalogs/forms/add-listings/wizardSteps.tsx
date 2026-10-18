import { Boxes, Layers, Tag } from 'lucide-react';
import type { WizardStepDef } from '@/components/wizardSteps';

export type ListingWizardStep = 'offering' | 'variants' | 'prices';

const ALL_STEPS: WizardStepDef<ListingWizardStep>[] = [
  { key: 'offering', label: 'Offering', icon: <Boxes className="h-4 w-4" /> },
  { key: 'variants', label: 'Variants', icon: <Layers className="h-4 w-4" /> },
  { key: 'prices', label: 'MRPs & prices', icon: <Tag className="h-4 w-4" /> },
];

// A catalog with no currency has nothing to price in, so the last step would be a form with no answer to
// give — those variants are listed for any batch, unpriced, straight from the second step.
export const listingWizardSteps = (canPrice: boolean): WizardStepDef<ListingWizardStep>[] =>
  canPrice ? ALL_STEPS : ALL_STEPS.slice(0, 2);
