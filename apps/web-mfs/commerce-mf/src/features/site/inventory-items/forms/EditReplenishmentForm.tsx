import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { replenishmentSections } from '@/components/inventory-items/replenishmentSections';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { useUpdateReplenishment } from '@/hooks/site/inventory-items';
import type { SiteStockTableItemData } from '@/schemas/inventory-items';
import {
  buildReplenishmentSchema,
  type ReplenishmentFormData,
  ReplenishmentMethodValues,
  replenishmentPayload,
} from '@/schemas/site-items';

interface EditReplenishmentFormProps {
  item: SiteStockTableItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how the current site replenishes the item
export const EditReplenishmentForm: React.FC<EditReplenishmentFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<ReplenishmentFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildReplenishmentSchema({ reorderPoint: values.reorderPoint, allowDecimal: item.uomAllowDecimal }))(
        values,
        context,
        options,
      ),
    defaultValues: {
      replenishment: item.replenishment ?? ReplenishmentMethodValues.REORDER_POINT,
      safetyStock: item.safetyStock,
      reorderPoint: item.reorderPoint,
      maxStock: item.maxStock,
    },
  });
  const [replenishment, safetyStock, reorderPoint] = useWatch({
    control: form.control,
    name: ['replenishment', 'safetyStock', 'reorderPoint'],
  });

  const updateMutation = useUpdateReplenishment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ inventoryItemId: item.id, data: replenishmentPayload(data) })}
    >
      <div className="flex flex-col gap-6">
        {replenishmentSections({
          replenishment,
          safetyStock,
          reorderPoint,
          allowDecimal: item.uomAllowDecimal,
          uomSymbol: item.uomSymbol,
          preview: <StockLevelsFormPreview control={form.control} onHand={item.onHand} uomSymbol={item.uomSymbol} />,
        })}
      </div>
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
