import { Button } from '@vritti/quantum-ui/Button';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ChevronsUpDown, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupplierItemSelector } from '@/utils/RemoteSelectors';

interface SupplierItemSwitcherProps {
  // The raw `name~uuid` breadcrumb segment of an LE supplier item view
  segment: string;
  // The supplier whose items are offered
  supplierId: string;
  // The supplier root, e.g. `/le/<id>/suppliers/<supplierSlug>`
  basePath: string;
  // The item tab open now (overview, sites, prices), kept when switching items
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
  const current = idOf(segment);

  return (
    <SupplierItemSelector
      params={{ supplierId }}
      value={current}
      transformLabel={itemLabel}
      // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
      label={undefined}
      searchPlaceholder="Find item..."
      contentClassName="w-72"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<Package className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 gap-1.5 p-0 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-normal text-foreground">
            {selectedOption?.label ?? labelOf(segment)}
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
              onClick={() => navigate(`${basePath}/items`)}
            >
              All Items
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same item) — only navigate on a real switch
        if (option && String(option.value) !== current) {
          const slug = buildSlug(itemLabel(String(option.label), option), String(option.value));
          navigate(tab ? `${basePath}/${slug}/${tab}` : `${basePath}/${slug}`);
        }
      }}
    />
  );
};
