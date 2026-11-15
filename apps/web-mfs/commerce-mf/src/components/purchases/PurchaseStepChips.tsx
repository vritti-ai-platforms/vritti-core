import { Badge, type BadgeProps } from '@vritti/quantum-ui/Badge';
import { Check, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import {
  type PurchaseFlowStepState,
  PurchaseFlowStepStateValues,
  type PurchaseLegFlowStep,
  purchaseLegStepConfig,
} from '@/schemas/purchases';

const STATE_VARIANTS: Record<PurchaseFlowStepState, BadgeProps['variant']> = {
  DONE: 'success',
  CURRENT: 'default',
  UPCOMING: 'outline',
};

// A flow's steps in order: the ones behind it done with a tick, the current one highlighted, the rest ahead
export const PurchaseStepChips = ({ steps }: { steps: PurchaseLegFlowStep[] }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {steps.map(({ step, state }, index) => (
      <Fragment key={step}>
        {index > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
        <Badge variant={STATE_VARIANTS[state]}>
          {state === PurchaseFlowStepStateValues.DONE && <Check className="size-3" />}
          {purchaseLegStepConfig[step].label}
        </Badge>
      </Fragment>
    ))}
  </div>
);
