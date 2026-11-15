import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Boxes } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfferingVariantSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface VariantSwitcherProps {
  // The raw `code~uuid` breadcrumb segment
  segment: string;
  // The parent offering, which scopes the options — a code only means anything beside its siblings
  offeringId: string;
  // The variants root, e.g. `/<kind>/<id>/offerings/<offeringSlug>/variants`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const VariantSwitcher = ({ segment, offeringId, basePath }: VariantSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={Boxes} label={label} to={`${basePath}/${segment}`} mono>
      <OfferingVariantSelector
        offeringId={offeringId}
        value={current}
        label={undefined}
        searchPlaceholder="Find variant..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch variant" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Variants
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current variant: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.description ?? option.label));
            return;
          }
          // The option's label is its offering; the code, its description, is what a variant's URL is slugged by
          navigate(`${basePath}/${buildSlug(String(option.description ?? option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
