import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { ChevronsUpDown, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InventoryItemSelector } from '@/utils/RemoteSelectors';

interface InventoryItemSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The inventory items root, e.g. `/le/<id>/inventory-items`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const InventoryItemSwitcher = ({ segment, basePath }: InventoryItemSwitcherProps) => {
  const navigate = useNavigate();
  const current = idOf(segment);

  return (
    <InventoryItemSelector
      value={current}
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
              onClick={() => navigate(basePath)}
            >
              All Inventory Items
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same item) — only navigate on a real switch
        if (option && String(option.value) !== current) {
          // Lands on the item root rather than the current tab; the LE view redirects it to Overview on its own
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }
      }}
    />
  );
};
