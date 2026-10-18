import type { StepDef } from '@vritti/quantum-ui/StepProgressIndicator';
import type React from 'react';

export interface WizardStepDef<TKey extends string> {
  key: TKey;
  label: string;
  icon: React.ReactNode;
}

export function toStepDefs<TKey extends string>(steps: WizardStepDef<TKey>[]): StepDef[] {
  return steps.map((step) => ({ label: step.label, icon: step.icon }));
}

// The 1-based position StepProgressIndicator expects
export function stepNumber<TKey extends string>(steps: WizardStepDef<TKey>[], key: TKey): number {
  const index = steps.findIndex((step) => step.key === key);
  return index < 0 ? 1 : index + 1;
}
