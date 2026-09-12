import type { StepDef } from '@vritti/quantum-ui/StepProgressIndicator';
import { Grid3x3, ListChecks } from 'lucide-react';
import type React from 'react';

export type VariantWizardStep = 'values' | 'combinations';

interface WizardStepDef {
  key: VariantWizardStep;
  label: string;
  icon: React.ReactNode;
}

export const VARIANT_WIZARD_STEPS: WizardStepDef[] = [
  { key: 'values', label: 'Values', icon: <ListChecks className="h-4 w-4" /> },
  { key: 'combinations', label: 'Combinations', icon: <Grid3x3 className="h-4 w-4" /> },
];

export function toStepDefs(steps: WizardStepDef[]): StepDef[] {
  return steps.map((step) => ({ label: step.label, icon: step.icon }));
}

// The 1-based position StepProgressIndicator expects
export function stepNumber(steps: WizardStepDef[], key: VariantWizardStep): number {
  const index = steps.findIndex((step) => step.key === key);
  return index < 0 ? 1 : index + 1;
}
