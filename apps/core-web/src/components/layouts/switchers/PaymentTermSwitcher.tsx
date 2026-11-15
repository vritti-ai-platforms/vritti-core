import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaymentTermSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface PaymentTermSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The payment terms root, e.g. `/org/<id>/payment-terms`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const PaymentTermSwitcher = ({ segment, basePath }: PaymentTermSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={CalendarClock} label={label} to={`${basePath}/${segment}`}>
      <PaymentTermSelector
        value={current}
        // Draft terms are still pages you can open, so the switcher lists them too
        allowUnpublished
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find payment term..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch payment term" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Payment Terms
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current payment term: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the term root, which redirects to Overview on its own
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
