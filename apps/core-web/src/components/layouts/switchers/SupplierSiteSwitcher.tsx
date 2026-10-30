import { Button } from '@vritti/quantum-ui/Button';
import { Separator } from '@vritti/quantum-ui/Separator';
import { ChevronsUpDown, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SupplierSiteSelector } from '@/utils/RemoteSelectors';

interface SupplierSiteSwitcherProps {
  // The bare site id breadcrumb segment of an LE supplier site view
  siteId: string;
  // The supplier whose enrolled sites are offered
  supplierId: string;
  // The supplier root, e.g. `/le/<id>/suppliers/<supplierSlug>`
  basePath: string;
  // The site's name as the breadcrumb already knows it, shown until the selector resolves
  fallbackLabel: string;
}

export const SupplierSiteSwitcher = ({ siteId, supplierId, basePath, fallbackLabel }: SupplierSiteSwitcherProps) => {
  const navigate = useNavigate();

  return (
    <SupplierSiteSelector
      supplierId={supplierId}
      // Every site has a supplier view, enrolled or not
      enrolledOnly={false}
      value={siteId}
      // The anchor replaces the trigger but not the surrounding Field, so a label would still render above it
      label={undefined}
      searchPlaceholder="Find site..."
      contentClassName="w-72"
      anchor={({ selectedOption }) => (
        <Button
          startAdornment={<Store className="size-4 text-muted-foreground" />}
          variant="ghost"
          className="h-auto min-w-25 gap-1.5 p-0 text-sm font-normal hover:bg-transparent"
        >
          <span className="flex-1 text-left font-normal text-foreground">{selectedOption?.label ?? fallbackLabel}</span>
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
              onClick={() => navigate(`${basePath}/sites`)}
            >
              All Sites
            </Button>
          </div>
        </>
      }
      onOptionSelect={(option) => {
        // Skip the on-mount initial-resolve fire (same site) — only navigate on a real switch
        if (option && String(option.value) !== siteId) {
          // Lands on the site view rather than an item below it: the item may not be set up at the next site
          navigate(`${basePath}/${String(option.value)}`);
        }
      }}
    />
  );
};
