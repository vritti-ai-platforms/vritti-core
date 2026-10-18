import { Button } from '@vritti/quantum-ui/Button';
import { ArrowLeft } from 'lucide-react';
import type React from 'react';
import { useAddListingsWizard } from './AddListingsProvider';

interface WizardFooterProps {
  // What this step is about to produce, shown on the left. Absent on the steps that have nothing to count yet.
  summary?: React.ReactNode;
  // Next on the selection steps, the submit button on the last one — which is why each step renders its own
  // footer rather than the page rendering one for all three
  children: React.ReactNode;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({ summary, children }) => {
  const { position, goBack } = useAddListingsWizard();

  return (
    <div className="flex items-center justify-between border-t pt-4">
      {summary ?? <span />}
      <div className="flex gap-2">
        {position > 1 ? (
          <Button type="button" variant="outline" startAdornment={<ArrowLeft className="size-4" />} onClick={goBack}>
            Back
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
};
