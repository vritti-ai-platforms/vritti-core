import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import Decimal from '@vritti/quantum-ui/decimal';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ItemQuantityField } from '@/components/inventory-items/ItemQuantityField';
import { StockLevelsPreview } from '@/components/inventory-items/StockLevelsPreview';
import { type SiteItemAdditionals, siteItemAdditionalsSchema } from '@/schemas/inventory-items';
import { type AddPurchaseItemFormData, buildAddPurchaseItemSchema, type PurchaseDetail } from '@/schemas/purchases';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import type { PurchasesBinding } from '../bindings';

interface AddPurchaseItemDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds an item the purchase does not have yet, in its primary unit; the picker leaves out the items already on it
export const AddPurchaseItemDialog: React.FC<AddPurchaseItemDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  // The picked item's stock at the purchase's site against its levels there, from the picker's option; with a reorder
  // point the quantity starts at what tops it up to the maximum stock
  const [stock, setStock] = useState<SiteItemAdditionals | null>(null);
  const form = useForm<AddPurchaseItemFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildAddPurchaseItemSchema({ allowDecimal: stock?.allowDecimal ?? true }))(values, context, options),
    defaultValues: { notes: '' },
  });
  const inventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });
  const addMutation = binding.useAddItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        inventoryItemId: data.inventoryItemId,
        primaryQty: data.primaryQty,
        neededBy: data.neededBy || undefined,
        notes: data.notes.trim() || undefined,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Item"
        atSiteId={purchase.siteId}
        notOnPurchaseId={purchase.id}
        onOptionSelect={(option) => {
          const parsed = siteItemAdditionalsSchema.safeParse(option.additionals);
          if (!parsed.success) {
            setStock(null);
            return;
          }
          setStock(parsed.data);
          if (parsed.data.maxStock === null) {
            form.resetField('primaryQty');
            return;
          }
          const shortfall = new Decimal(parsed.data.maxStock).minus(parsed.data.onHand);
          const toMax = parsed.data.allowDecimal ? shortfall : shortfall.ceil();
          if (toMax.gt(0)) form.setValue('primaryQty', toMax.toNumber(), { shouldValidate: true });
          else form.resetField('primaryQty');
        }}
      />
      {stock && (
        <StockLevelsPreview
          onHand={stock.onHand}
          replenishment={stock.replenishment}
          safetyStock={stock.safetyStock}
          reorderPoint={stock.reorderPoint}
          maxStock={stock.maxStock}
          status={stock.stockStatus}
          uomSymbol={stock.uomSymbol}
          display={stock.display}
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <ItemQuantityField
          name="primaryQty"
          label="Quantity"
          inventoryItemId={inventoryItemId}
          description="In any of the item's units"
        />
        <DatePicker name="neededBy" label="Needed By" />
      </div>
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Item
        </Button>
      </DialogActions>
    </Form>
  );
};
