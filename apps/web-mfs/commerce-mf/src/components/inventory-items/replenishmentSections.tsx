import { FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import type React from 'react';
import { ItemQuantityField } from '@/components/inventory-items/ItemQuantityField';
import { type ReplenishmentMethod, ReplenishmentMethodValues, replenishmentOptions } from '@/schemas/site-items';

interface ReplenishmentSectionsOptions {
  inventoryItemId: string | undefined;
  replenishment: ReplenishmentMethod;
  uomSymbol: string;
  // The stock bar previewing the levels being typed, drawn above them
  preview: React.ReactNode;
}

// How the site restocks the item and, for a reorder point, its three levels in the order the stock bar draws them;
// plain sections rather than a component so <Form> wires each field by name
export function replenishmentSections({
  inventoryItemId,
  replenishment,
  uomSymbol,
  preview,
}: ReplenishmentSectionsOptions) {
  return (
    <>
      <FormSection title="Replenishment" description="How the site restocks this item." contentClassName="block">
        <RadioGroup name="replenishment" variant="card" orientation="horizontal" options={replenishmentOptions} />
      </FormSection>
      {replenishment === ReplenishmentMethodValues.REORDER_POINT && (
        <FormSection
          title="Stock Levels"
          description={`Typed in any of the item's units and kept in ${uomSymbol}, its primary unit. Safety stock is optional.`}
          contentClassName="flex flex-col gap-4"
        >
          {preview}
          <div className="grid grid-cols-3 gap-4">
            <ItemQuantityField
              name="safetyStock"
              label="Safety Stock"
              inventoryItemId={inventoryItemId}
              nullable
              placeholder="0"
              description="Kept back for demand spikes"
            />
            <ItemQuantityField
              name="reorderPoint"
              label="Reorder Point"
              inventoryItemId={inventoryItemId}
              nullable
              description="Reorder when stock falls to this"
            />
            <ItemQuantityField
              name="maxStock"
              label="Maximum Stock"
              inventoryItemId={inventoryItemId}
              nullable
              description="The most the site should hold"
            />
          </div>
        </FormSection>
      )}
    </>
  );
}
