import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Truck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissionContext } from '@/providers/PermissionProvider';
import { SiteSupplierSelector, SupplierSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface SupplierSwitcherProps {
  // The raw `name~uuid` breadcrumb segment; the id addresses the API, the slug is the fallback label
  segment: string;
  // The suppliers root, e.g. `/le/<id>/suppliers`
  basePath: string;
}

const idOf = (segment: string) => segment.slice(segment.indexOf('~') + 1);
const labelOf = (segment: string) => segment.slice(0, Math.max(segment.indexOf('~'), 0)) || segment;

export const SupplierSwitcher = ({ segment, basePath }: SupplierSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(labelOf(segment));
  const current = idOf(segment);
  const { workspace } = usePermissionContext();
  // In a site workspace each supplier shows whether it is enrolled there; the list itself is never narrowed, so inactive
  // suppliers stay reachable too
  const Selector = workspace?.kind === 'site' ? SiteSupplierSelector : SupplierSelector;

  return (
    <SwitcherCrumb icon={Truck} label={label} to={`${basePath}/${segment}`}>
      <Selector
        value={current}
        activeOnly={false}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find supplier..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch supplier" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(basePath)}
              >
                All Suppliers
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current supplier: it names the crumb; any other is a real switch
          if (String(option.value) === current) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the supplier root rather than the current tab or site: a site or item below is meaningless on a
          // different supplier, and the LE root redirects to Overview on its own
          navigate(`${basePath}/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
