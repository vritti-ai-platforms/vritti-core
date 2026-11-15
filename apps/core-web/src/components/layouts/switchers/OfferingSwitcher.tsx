import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfferingSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface OfferingSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The offerings root, e.g. `/<kind>/<id>/offerings`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const OfferingSwitcher = ({ segment, basePath }: OfferingSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={ShoppingBag} label={label} to={`${basePath}/${segment}`}>
      <OfferingSelector
        value={current}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find offering..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch offering" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Offerings
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current offering: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the offering root rather than the current tab: a tab that suits one offering
          // need not suit the next, and the variant segment below is meaningless on a different one
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
