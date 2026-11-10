import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { CalendarClock, Plus } from 'lucide-react';
import type React from 'react';
import type { SupplierSiteItemPageBinding } from '../../bindings';
import { AddSitePriceDialog } from './forms/AddSitePriceDialog';

interface AddSitePriceActionProps {
  siteItemPage: SupplierSiteItemPageBinding;
  supplierId: string;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  currencyCode: string;
  currencyCodes: string[];
  // Prices can be added only once the item is set up at the site
  isSetUp: boolean;
}

// Adds a validity-dated price for the supplier item at the workspace's site
export const AddSitePriceAction: React.FC<AddSitePriceActionProps> = ({
  siteItemPage,
  supplierId,
  itemId,
  inventoryItemId,
  uomId,
  currencyCode,
  currencyCodes,
  isSetUp,
}) => {
  const addDialog = useDialog();
  return (
    <>
      <Button
        size="sm"
        permission={siteItemPage.prices.permissions.add}
        disabled={!isSetUp}
        disabledTip="Set the item up at this site before pricing it"
        startAdornment={<Plus className="size-4" />}
        onClick={addDialog.open}
      >
        Add Price
      </Button>
      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Price"
        description="Add a site-specific price for this item at your site."
        content={(close) => (
          <AddSitePriceDialog
            siteItemPage={siteItemPage}
            supplierId={supplierId}
            itemId={itemId}
            inventoryItemId={inventoryItemId}
            uomId={uomId}
            currencyCode={currencyCode}
            currencyCodes={currencyCodes}
            onSuccess={close}
            onCancel={close}
          />
        )}
      />
    </>
  );
};
