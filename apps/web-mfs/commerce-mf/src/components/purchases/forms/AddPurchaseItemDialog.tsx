import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import Decimal from '@vritti/quantum-ui/decimal';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StockLevelsPreview } from '@/components/inventory-items/StockLevelsPreview';
import { type SiteItemAdditionals, siteItemAdditionalsSchema } from '@/schemas/inventory-items';
import { type AddPurchaseItemFormData, addPurchaseItemSchema, type PurchaseDetail } from '@/schemas/purchases';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import type { PurchasesBinding } from '../bindings';

interface AddPurchaseItemDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds an item to the purchase in its primary unit; an item already there gets the quantity added
export const AddPurchaseItemDialog: React.FC<AddPurchaseItemDialogProps> = ({
  binding,
  purchase,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddPurchaseItemFormData>({
    resolver: zodResolver(addPurchaseItemSchema),
    defaultValues: { notes: '' },
  });
  const addMutation = binding.useAddItem({ onSuccess });
  // The picked item's stock at the purchase's site against its levels there, from the picker's option; with a reorder
  // point the quantity starts at what tops it up to the maximum stock
  const [stock, setStock] = useState<SiteItemAdditionals | null>(null);

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
        />
      )}
      <div className="grid grid-cols-2 gap-4">
        <TextField
          name="primaryQty"
          label="Quantity"
          type="number"
          positive
          nonZero
          integer={stock?.allowDecimal === false}
          description="In the item's primary unit — tablets, bottles, pieces"
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
