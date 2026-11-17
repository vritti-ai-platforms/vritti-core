import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { replenishmentSections } from '@/components/inventory-items/replenishmentSections';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { useAddToSite } from '@/hooks/site/inventory-items';
import { useSiteId } from '@/hooks/site/useSiteId';
import { itemUnitAdditionalsSchema, type SiteStockTableItemData } from '@/schemas/inventory-items';
import {
  type AddToSiteFormData,
  buildAddToSiteSchema,
  ReplenishmentMethodValues,
  replenishmentPayload,
} from '@/schemas/site-items';
import { InventoryItemSelector } from '@/selectors/inventory-item';

interface AddToSiteFormProps {
  // The item to add, when the dialog is opened from its row; otherwise one is picked
  item?: SiteStockTableItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds an item the current site does not carry, with how the site replenishes it, which lets the site buy and stock it
export const AddToSiteForm: React.FC<AddToSiteFormProps> = ({ item, onSuccess, onCancel }) => {
  // The item's primary unit: the row's, or the picked option's once one is picked
  const [unit, setUnit] = useState(item && { uomSymbol: item.uomSymbol, allowDecimal: item.uomAllowDecimal });
  const form = useForm<AddToSiteFormData>({
    resolver: (values, context, options) =>
      zodResolver(
        buildAddToSiteSchema({ reorderPoint: values.reorderPoint, allowDecimal: unit?.allowDecimal ?? false }),
      )(values, context, options),
    defaultValues: {
      inventoryItemId: item?.id,
      replenishment: ReplenishmentMethodValues.REORDER_POINT,
      safetyStock: null,
      reorderPoint: null,
      maxStock: null,
    },
  });
  const [replenishment, safetyStock, reorderPoint] = useWatch({
    control: form.control,
    name: ['replenishment', 'safetyStock', 'reorderPoint'],
  });

  const siteId = useSiteId();
  const addMutation = useAddToSite({ onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ inventoryItemId: data.inventoryItemId, data: replenishmentPayload(data) })}
    >
      <div className="flex flex-col gap-6">
        {!item && (
          <FormSection title="Item" description="Only the items this site does not carry yet." contentClassName="block">
            <InventoryItemSelector
              name="inventoryItemId"
              notAtSiteId={siteId}
              fieldKeys={{ descriptionKey: 'sku' }}
              onOptionSelect={(option) => setUnit(itemUnitAdditionalsSchema.safeParse(option.additionals).data)}
            />
          </FormSection>
        )}
        {unit !== undefined &&
          replenishmentSections({
            replenishment,
            safetyStock,
            reorderPoint,
            allowDecimal: unit.allowDecimal,
            uomSymbol: unit.uomSymbol,
            preview: (
              <StockLevelsFormPreview control={form.control} onHand={item?.onHand ?? 0} uomSymbol={unit.uomSymbol} />
            ),
          })}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add to Site
        </Button>
      </DialogActions>
    </Form>
  );
};
