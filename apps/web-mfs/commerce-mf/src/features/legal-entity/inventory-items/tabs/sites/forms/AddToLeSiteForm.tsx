import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { replenishmentSections } from '@/components/inventory-items/replenishmentSections';
import { StockLevelsFormPreview } from '@/components/inventory-items/StockLevelsPreview';
import { useAddToLeSite } from '@/hooks/legal-entity/inventory-items';
import {
  type AddToLeSiteFormData,
  buildAddToLeSiteSchema,
  ReplenishmentMethodValues,
  replenishmentPayload,
} from '@/schemas/site-items';
import { SiteSelector } from '@/selectors/site';

interface AddToLeSiteFormProps {
  inventoryItemId: string;
  // The site to add it to, when the dialog is opened from its row; otherwise one that does not carry it is picked
  siteId?: string;
  uomSymbol: string;
  // Whether the item's primary unit can be split; levels are whole numbers when it cannot
  allowDecimal: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

// Adds the item to one of the legal entity's sites that does not carry it, which lets that site buy and stock it; such a
// site holds none of the item, so the preview starts from nothing on hand
export const AddToLeSiteForm: React.FC<AddToLeSiteFormProps> = ({
  inventoryItemId,
  siteId,
  uomSymbol,
  allowDecimal,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddToLeSiteFormData>({
    resolver: (values, context, options) =>
      zodResolver(buildAddToLeSiteSchema({ reorderPoint: values.reorderPoint, allowDecimal }))(
        values,
        context,
        options,
      ),
    defaultValues: {
      siteId,
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

  const addMutation = useAddToLeSite(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ siteId: data.siteId, data: replenishmentPayload(data) })}
    >
      <div className="flex flex-col gap-6">
        {!siteId && (
          <FormSection
            title="Site"
            description="Only the sites that do not carry this item yet."
            contentClassName="block"
          >
            <SiteSelector name="siteId" params={{ notCarrying: inventoryItemId }} />
          </FormSection>
        )}
        {replenishmentSections({
          replenishment,
          safetyStock,
          reorderPoint,
          allowDecimal,
          uomSymbol,
          preview: <StockLevelsFormPreview control={form.control} onHand={0} uomSymbol={uomSymbol} />,
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
