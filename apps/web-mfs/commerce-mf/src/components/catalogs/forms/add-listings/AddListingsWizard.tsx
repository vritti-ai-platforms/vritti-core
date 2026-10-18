import { Button } from '@vritti/quantum-ui/Button';
import { PageHeader } from '@vritti/quantum-ui/PageHeader';
import { StepProgressIndicator } from '@vritti/quantum-ui/StepProgressIndicator';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { toStepDefs } from '@/components/wizardSteps';
import { useAddListingsWizard } from './AddListingsProvider';
import { OfferingStep } from './OfferingStep';
import { PricesStep } from './PricesStep';
import { VariantsStep } from './VariantsStep';
import type { ListingWizardStep } from './wizardSteps';

const renderStep = (step: ListingWizardStep) => {
  switch (step) {
    case 'offering':
      return <OfferingStep />;
    case 'variants':
      return <VariantsStep />;
    case 'prices':
      return <PricesStep />;
  }
};

// The wizard's frame. Each step renders its own fields and its own footer — only the last one is a form.
export const AddListingsWizard: React.FC = () => {
  const { catalogName, steps, step, position } = useAddListingsWizard();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <PageHeader
        title="Add Listings"
        description={`${catalogName} — variants already listed here are not offered`}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate('..', { relative: 'path' })}>
            Cancel
          </Button>
        }
      />

      {/* Floored only from lg up, where the room exists, so the connectors keep their length instead of
          collapsing; below that it shrinks freely, and the strip alone scrolls if the labels stop fitting */}
      <div className="overflow-x-auto pt-6">
        <div className="lg:min-w-3xl">
          <StepProgressIndicator steps={toStepDefs(steps)} currentStep={position} />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6">{renderStep(step)}</div>
    </div>
  );
};
