import { FormSection } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { type ReplenishmentMethod, ReplenishmentMethodValues, replenishmentOptions } from '@/schemas/site-items';

interface ReplenishmentSectionsOptions {
  replenishment: ReplenishmentMethod;
  // The levels being typed: the safety stock bounds the reorder point below, the reorder point bounds the safety stock
  // above and the maximum stock below
  safetyStock: number | null;
  reorderPoint: number | null;
  // Whether the item's unit can be split; levels are whole numbers when it cannot
  allowDecimal: boolean;
  uomSymbol: string;
  // The stock bar previewing the levels being typed, drawn above them
  preview: React.ReactNode;
}

// How the site restocks the item and, for a reorder point, its three levels in the order the stock bar draws them;
// plain sections rather than a component so <Form> wires each field by name
export function replenishmentSections({
  replenishment,
  safetyStock,
  reorderPoint,
  allowDecimal,
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
          description={`In ${uomSymbol}, the item's primary unit. Safety stock is optional.`}
          contentClassName="flex flex-col gap-4"
        >
          {preview}
          <div className="grid grid-cols-3 gap-4">
            <TextField
              name="safetyStock"
              label="Safety Stock"
              type="number"
              integer={!allowDecimal}
              min={0}
              max={reorderPoint ?? undefined}
              placeholder="0"
              endAdornment={uomSymbol}
              description="Kept back for demand spikes"
            />
            <TextField
              name="reorderPoint"
              label="Reorder Point"
              type="number"
              integer={!allowDecimal}
              positive
              nonZero
              min={safetyStock ?? undefined}
              endAdornment={uomSymbol}
              description="Reorder when stock falls to this"
            />
            <TextField
              name="maxStock"
              label="Maximum Stock"
              type="number"
              integer={!allowDecimal}
              positive
              nonZero
              min={reorderPoint ?? undefined}
              endAdornment={uomSymbol}
              description="The most the site should hold"
            />
          </div>
        </FormSection>
      )}
    </>
  );
}
