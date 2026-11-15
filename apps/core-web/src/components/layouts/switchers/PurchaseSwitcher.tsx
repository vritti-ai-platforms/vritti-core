import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PurchaseSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface PurchaseSwitcherProps {
  // The raw `number~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The purchases root, e.g. `/site/<id>/purchases`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const PurchaseSwitcher = ({ segment, basePath }: PurchaseSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={ShoppingCart} label={label} to={`${basePath}/${segment}`}>
      <PurchaseSelector
        value={current}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find purchase..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch purchase" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Purchases
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current purchase: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Same `number~id` slug the purchases table opens a row with
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
