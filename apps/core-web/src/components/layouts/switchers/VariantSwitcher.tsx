import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Boxes, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OfferingVariantSelector } from '@/utils/RemoteSelectors';

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
  const current = idOf(segment);

  return (
    <OfferingVariantSelector
      offeringId={offeringId}
      value={current}
      label={undefined}
      searchPlaceholder="Find variant..."
      contentClassName="w-72"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<Boxes className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 gap-1.5 p-0 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-mono font-normal text-foreground">
            {selectedOption?.description ?? labelOf(segment)}
          </span>
          <span className="flex size-6 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent">
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </span>
        </Button>
      )}
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
        if (option && String(option.value) !== current) {
          // The option's label is its offering; the code, its description, is what a variant's URL is slugged by
          navigate(`${basePath}/${buildSlug(String(option.description ?? option.label), String(option.value))}`);
        }
      }}
    />
  );
};
