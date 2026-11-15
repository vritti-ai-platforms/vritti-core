import { StepProgressIndicator } from '@vritti/quantum-ui/StepProgressIndicator';
import { CircleCheckBig, ClipboardList, FileText, Split, Truck } from 'lucide-react';
import type React from 'react';
import {
  type PurchaseHeader,
  PurchaseStatusValues,
  type PurchaseStep,
  PurchaseStepValues,
  purchaseStatusConfig,
  purchaseStepConfig,
} from '@/schemas/purchases';
import { purchaseStages } from './purchaseState';

interface PurchaseStageBarProps {
  purchase: PurchaseHeader;
  viewed: PurchaseStep;
  onView: (stage: PurchaseStep) => void;
}

const STAGE_ICONS: Record<PurchaseStep, React.ReactNode> = {
  REQUESTING: <ClipboardList className="size-4" />,
  QUOTING: <FileText className="size-4" />,
  SOURCING: <Split className="size-4" />,
  PROCURING: <Truck className="size-4" />,
};

// How far the current stage has got, for its step's bar: allocated while Sourcing, received while Procuring
function currentStageProgress({ step, progress }: Pick<PurchaseHeader, 'step' | 'progress'>): number {
  if (step === PurchaseStepValues.SOURCING) return 100 - progress.segments.unallocated;
  if (step === PurchaseStepValues.PROCURING) return progress.segments.received + progress.segments.invoiced;
  return 0;
}

// The purchase's stages as navigation: the current stage and those behind it open their view; a skipped Quoting is left
// out, and Completed closes the line once every supplier is done
export const PurchaseStageBar: React.FC<PurchaseStageBarProps> = ({ purchase, viewed, onView }) => {
  const stages = purchaseStages(purchase).filter((stage) => !stage.isSkipped);
  const steps = [
    ...stages.map((stage) => ({ label: purchaseStepConfig[stage.step].label, icon: STAGE_ICONS[stage.step] })),
    { label: purchaseStatusConfig.COMPLETED.label, icon: <CircleCheckBig className="size-4" /> },
  ];
  const currentIndex = stages.findIndex((stage) => stage.step === purchase.step);
  const currentStep = purchase.status === PurchaseStatusValues.COMPLETED ? steps.length + 1 : currentIndex + 1;

  return (
    <StepProgressIndicator
      steps={steps}
      currentStep={currentStep}
      progress={currentStageProgress(purchase)}
      selectedStep={stages.findIndex((stage) => stage.step === viewed) + 1}
      isStepClickable={(step) => stages[step - 1]?.isViewable ?? false}
      onStepClick={(step) => onView(stages[step - 1].step)}
    />
  );
};
