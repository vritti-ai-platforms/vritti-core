import { Boxes, Layers, Tag } from 'lucide-react';
import type { WizardStepDef } from '@/components/wizardSteps';

export type ListingWizardStep = 'offering' | 'variants' | 'prices';

export const LISTING_WIZARD_STEPS: WizardStepDef<ListingWizardStep>[] = [
  { key: 'offering', label: 'Offering', icon: <Boxes className="h-4 w-4" /> },
  { key: 'variants', label: 'Variants', icon: <Layers className="h-4 w-4" /> },
  { key: 'prices', label: 'MRPs & prices', icon: <Tag className="h-4 w-4" /> },
];
