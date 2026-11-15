import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { stockLevelFields } from '@/components/inventory-items/stockLevelFields';
import { useCreateSiteStockLevels } from '@/hooks/legal-entity/inventory-items';
import { type SetSiteStockLevelsFormData, setSiteStockLevelsSchema } from '@/schemas/site-stock-levels';
import { SiteSelector } from '@/selectors/site';

interface SetSiteStockLevelsFormProps {
  inventoryItemId: string;
  // The site to set them at, when the dialog is opened from its row; otherwise one with no stock levels is picked
  siteId?: string;
  uomSymbol: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

// Sets the item's stock levels at one of the legal entity's sites that has none, which lets that site buy and stock it;
// a site with no stock levels holds none of the item, so the preview starts from nothing on hand
export const SetSiteStockLevelsForm: React.FC<SetSiteStockLevelsFormProps> = ({
  inventoryItemId,
  siteId,
  uomSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSiteStockLevelsFormData>({
    resolver: zodResolver(setSiteStockLevelsSchema),
    defaultValues: { siteId, reorderPoint: null, safetyStock: null, maxStockLevel: null },
  });

  const createMutation = useCreateSiteStockLevels(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId: data.siteId,
        data: {
          reorderPoint: data.reorderPoint ?? 0,
          safetyStock: data.safetyStock ?? 0,
          maxStockLevel: data.maxStockLevel ?? 0,
        },
      })}
    >
      {!siteId && <SiteSelector name="siteId" params={{ withoutStockLevelsOf: inventoryItemId }} />}
      <StockLevelsFormPreview control={form.control} onHand={0} uomSymbol={uomSymbol} />
      {stockLevelFields(uomSymbol)}
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
