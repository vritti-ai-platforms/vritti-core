import { Grid3x3, ListChecks } from 'lucide-react';
import type { WizardStepDef } from '@/components/wizardSteps';

export type VariantWizardStep = 'values' | 'combinations';

export const VARIANT_WIZARD_STEPS: WizardStepDef<VariantWizardStep>[] = [
  { key: 'values', label: 'Values', icon: <ListChecks className="h-4 w-4" /> },
  { key: 'combinations', label: 'Combinations', icon: <Grid3x3 className="h-4 w-4" /> },
];
