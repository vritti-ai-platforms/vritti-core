import { LE_SUPPLIERS } from '@vritti/commerce-permissions/suppliers';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { CalendarClock, Plus } from 'lucide-react';
import type React from 'react';
import { AddSupplierItemPriceDialog } from '../forms/AddSupplierItemPriceDialog';

interface AddItemPriceActionProps {
  supplierId: string;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  currencyCode: string;
  currencyCodes: string[];
}

// Adds a validity-dated price for the supplier item at one or more of its sites
export const AddItemPriceAction: React.FC<AddItemPriceActionProps> = ({
  supplierId,
  itemId,
  inventoryItemId,
  uomId,
  currencyCode,
  currencyCodes,
}) => {
  const addDialog = useDialog();
  return (
    <>
      <Button
        size="sm"
        permission={LE_SUPPLIERS.items.prices.add}
        startAdornment={<Plus className="size-4" />}
        onClick={addDialog.open}
      >
        Add Price
      </Button>
      <Dialog
        handle={addDialog}
        icon={CalendarClock}
        title="Add Price"
        description="Add a validity-dated price for one or more of the sites this item is set up at."
        content={(close) => (
          <AddSupplierItemPriceDialog
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
