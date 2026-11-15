import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { stockLevelFields } from '@/components/inventory-items/stockLevelFields';
import { useUpdateSiteStockLevels } from '@/hooks/legal-entity/inventory-items';
import { type SiteStockLevelData, type StockLevelsFormData, stockLevelsSchema } from '@/schemas/site-stock-levels';

interface EditSiteStockLevelsFormProps {
  inventoryItemId: string;
  row: SiteStockLevelData;
  uomSymbol: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits the item's stock levels at one of the legal entity's sites
export const EditSiteStockLevelsForm: React.FC<EditSiteStockLevelsFormProps> = ({
  inventoryItemId,
  row,
  uomSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<StockLevelsFormData>({
    resolver: zodResolver(stockLevelsSchema),
    defaultValues: {
      reorderPoint: row.reorderPoint,
      safetyStock: row.safetyStock,
      maxStockLevel: row.maxStockLevel,
    },
  });

  const updateMutation = useUpdateSiteStockLevels(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId: row.siteId,
        data: {
          reorderPoint: data.reorderPoint ?? 0,
          safetyStock: data.safetyStock ?? 0,
          maxStockLevel: data.maxStockLevel ?? 0,
        },
      })}
    >
      <StockLevelsFormPreview control={form.control} onHand={row.onHand ?? 0} uomSymbol={uomSymbol} />
      {stockLevelFields(uomSymbol)}
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
