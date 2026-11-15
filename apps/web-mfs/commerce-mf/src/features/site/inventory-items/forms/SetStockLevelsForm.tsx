import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { stockLevelFields } from '@/components/inventory-items/stockLevelFields';
import { useSetStockLevels } from '@/hooks/site/inventory-items';
import type { SiteStockTableItemData } from '@/schemas/inventory-items';
import { type SetStockLevelsFormData, setStockLevelsSchema } from '@/schemas/site-stock-levels';
import { InventoryItemWithoutStockLevelsSelector } from '@/selectors/inventory-item';

interface SetStockLevelsFormProps {
  // The item to set them for, when the dialog is opened from its row; otherwise one is picked
  item?: SiteStockTableItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Sets the stock levels of an item the current site has none for, which lets the site buy and stock it
export const SetStockLevelsForm: React.FC<SetStockLevelsFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<SetStockLevelsFormData>({
    resolver: zodResolver(setStockLevelsSchema),
    defaultValues: { inventoryItemId: item?.id, reorderPoint: null, safetyStock: null, maxStockLevel: null },
  });

  const setMutation = useSetStockLevels({ onSuccess });

  return (
    <Form
      form={form}
      mutation={setMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        data: {
          reorderPoint: data.reorderPoint ?? 0,
          safetyStock: data.safetyStock ?? 0,
          maxStockLevel: data.maxStockLevel ?? 0,
        },
      })}
    >
      {!item && <InventoryItemWithoutStockLevelsSelector name="inventoryItemId" />}
      <StockLevelsFormPreview control={form.control} onHand={item?.onHand ?? 0} uomSymbol={item?.uomSymbol ?? null} />
      {stockLevelFields(item?.uomSymbol ?? null)}
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Setting...">
          Set Stock Levels
        </Button>
      </DialogActions>
    </Form>
  );
};
