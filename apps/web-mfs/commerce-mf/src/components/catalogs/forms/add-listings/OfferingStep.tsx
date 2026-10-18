import { Button } from '@vritti/quantum-ui/Button';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { ArrowRight } from 'lucide-react';
import type React from 'react';
import { OfferingSelector } from '@/selectors/offering';
import { useAddListingsWizard } from './AddListingsProvider';
import { WizardFooter } from './WizardFooter';

// Step one. Offerings whose every active variant this catalog already lists are not offered.
export const OfferingStep: React.FC = () => {
  const { catalogId, offeringId, canAdvance, selectOffering, goNext } = useAddListingsWizard();

  return (
    <>
      <OfferingSelector
        value={offeringId}
        onOptionSelect={(option: SelectOption | null) =>
          selectOffering(String(option?.value ?? ''), option?.label ?? '')
        }
        catalogId={catalogId}
        description="Its variants are what you can list. One offering at a time."
      />

      <WizardFooter>
        <Button type="button" disabled={!canAdvance} endAdornment={<ArrowRight className="size-4" />} onClick={goNext}>
          Next
        </Button>
      </WizardFooter>
    </>
  );
};
