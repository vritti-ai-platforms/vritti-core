import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Percent } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaxGroupSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface TaxGroupSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The tax groups root, e.g. `/org/<id>/tax-groups`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const TaxGroupSwitcher = ({ segment, basePath }: TaxGroupSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={Percent} label={label} to={`${basePath}/${segment}`}>
      <TaxGroupSelector
        value={current}
        // The breadcrumb has no country, so every country's groups are listed with the country beside each
        anyCountry
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find tax group..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch tax group" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Tax Groups
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current tax group: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the group root, which redirects to Overview on its own
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
