import { Button } from '@vritti/quantum-ui/Button';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupplierItemSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface SupplierItemSwitcherProps {
  // The raw `name~uuid` breadcrumb segment of an LE supplier item view
  segment: string;
  // The supplier whose items are offered
  supplierId: string;
  // The supplier root, e.g. `/le/<id>/suppliers/<supplierSlug>`
  basePath: string;
  // The item tab open now (overview, site-items, prices), kept when switching items
  tab: string | undefined;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

// The item's name with its unit, without the price the selector's list shows
function itemLabel(label: string, option: SelectOption): string {
  const name = label.replace(/\s-\s[^-]+$/, '');
  const uom = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol.trim() : '';
  return uom ? `${name} (${uom})` : name;
}

export const SupplierItemSwitcher = ({ segment, supplierId, basePath, tab }: SupplierItemSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);

  return (
    <SwitcherCrumb icon={Package} label={label} to={`${basePath}/items/${segment}`}>
      <SupplierItemSelector
        params={{ supplierId }}
        value={current}
        transformLabel={itemLabel}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find item..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch item" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(`${basePath}/items`)}
              >
                All Items
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current item: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          const slug = buildSlug(itemLabel(String(option.label), option), String(option.value));
          navigate(tab ? `${basePath}/items/${slug}/${tab}` : `${basePath}/items/${slug}`);
        }}
      />
    </SwitcherCrumb>
  );
};
