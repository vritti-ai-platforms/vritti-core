import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { stockLevelFields } from '@/components/inventory-items/stockLevelFields';
import { useUpdateStockLevels } from '@/hooks/site/inventory-items';
import type { SiteStockTableItemData } from '@/schemas/inventory-items';
import { type StockLevelsFormData, stockLevelsSchema } from '@/schemas/site-stock-levels';

interface EditStockLevelsFormProps {
  item: SiteStockTableItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits the item's stock levels at the current site
export const EditStockLevelsForm: React.FC<EditStockLevelsFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<StockLevelsFormData>({
    resolver: zodResolver(stockLevelsSchema),
    defaultValues: {
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      maxStockLevel: item.maxStockLevel,
    },
  });

  const updateMutation = useUpdateStockLevels({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: item.id,
        data: {
          reorderPoint: data.reorderPoint ?? 0,
          safetyStock: data.safetyStock ?? 0,
          maxStockLevel: data.maxStockLevel ?? 0,
        },
      })}
    >
      <StockLevelsFormPreview control={form.control} onHand={item.onHand} uomSymbol={item.uomSymbol} />
      {stockLevelFields(item.uomSymbol)}
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
