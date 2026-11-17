import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { replenishmentSections } from '@/components/inventory-items/replenishmentSections';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { useUpdateLeSiteReplenishment } from '@/hooks/legal-entity/inventory-items';
import {
  buildReplenishmentSchema,
  type ReplenishmentFormData,
  ReplenishmentMethodValues,
  replenishmentPayload,
  type SiteItemRowData,
} from '@/schemas/site-items';

interface EditLeSiteReplenishmentFormProps {
  inventoryItemId: string;
  row: SiteItemRowData;
  uomSymbol: string;
  // Whether the item's primary unit can be split; levels are whole numbers when it cannot
  allowDecimal: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how one of the legal entity's sites replenishes the item
export const EditLeSiteReplenishmentForm: React.FC<EditLeSiteReplenishmentFormProps> = ({
  inventoryItemId,
  row,
  uomSymbol,
  allowDecimal,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ReplenishmentFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildReplenishmentSchema({ reorderPoint: values.reorderPoint, allowDecimal }))(
        values,
        context,
        options,
      ),
    defaultValues: {
      replenishment: row.replenishment ?? ReplenishmentMethodValues.REORDER_POINT,
      safetyStock: row.safetyStock,
      reorderPoint: row.reorderPoint,
      maxStock: row.maxStock,
    },
  });
  const [replenishment, safetyStock, reorderPoint] = useWatch({
    control: form.control,
    name: ['replenishment', 'safetyStock', 'reorderPoint'],
  });

  const updateMutation = useUpdateLeSiteReplenishment(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ siteId: row.siteId, data: replenishmentPayload(data) })}
    >
      <div className="flex flex-col gap-6">
        {replenishmentSections({
          replenishment,
          safetyStock,
          reorderPoint,
          allowDecimal,
          uomSymbol,
          preview: <StockLevelsFormPreview control={form.control} onHand={row.onHand} uomSymbol={uomSymbol} />,
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
