import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { buildSlug } from '@vritti/quantum-ui/slug';
import { Store } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteSelector } from '@/utils/RemoteSelectors';
import { SwitcherCrumb, SwitcherTrigger } from './SwitcherCrumb';

interface EnrolledSiteSwitcherProps {
  // The site of an LE supplier enrollment view
  siteId: string;
  // The supplier root, e.g. `/le/<id>/suppliers/<supplierSlug>`
  basePath: string;
  // The site's name as the breadcrumb already knows it, shown until the selector resolves
  fallbackLabel: string; // The enrollment view the crumb names
  path: string;
}

export const EnrolledSiteSwitcher = ({ siteId, basePath, fallbackLabel, path }: EnrolledSiteSwitcherProps) => {
  const navigate = useNavigate();
  const [label, setLabel] = useState(fallbackLabel);

  // Every site of the legal entity has an enrollment view, enrolled or not
  return (
    <SwitcherCrumb icon={Store} label={label} to={path}>
      <SiteSelector
        value={siteId}
        // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
        label={undefined}
        searchPlaceholder="Find site..."
        contentClassName="w-72"
        anchor={() => <SwitcherTrigger label="Switch site" />}
        footer={
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                className="h-auto w-full justify-start px-2 py-1.5 text-sm font-normal"
                onClick={() => navigate(`${basePath}/enrollments`)}
              >
                All Sites
              </Button>
            </div>
          </>
        }
        onOptionSelect={(option) => {
          if (!option) return;
          // The on-mount initial-resolve fire is the current site: it names the crumb; any other is a real switch
          if (String(option.value) === siteId) {
            setLabel(String(option.label));
            return;
          }
          // Lands on the enrollment view rather than an item below it: the item may not be set up at the next site
          navigate(`${basePath}/enrollments/${buildSlug(String(option.label), String(option.value))}`);
        }}
      />
    </SwitcherCrumb>
  );
};
