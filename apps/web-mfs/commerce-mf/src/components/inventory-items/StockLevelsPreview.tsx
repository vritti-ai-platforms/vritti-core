import type React from 'react';
import { type Control, useWatch } from 'react-hook-form';
import type { SiteStockDisplay, StockStatus } from '@/schemas/inventory-items';
import type { ReplenishmentFormData, ReplenishmentMethod } from '@/schemas/site-items';
import { StockLevelBar } from './stock-level-bar/StockLevelBar';

interface StockLevelsPreviewProps {
  // Stock on hand at the site, in the primary unit; 0 while it isn't known (an item still to be picked)
  onHand: number;
  replenishment: ReplenishmentMethod | null;
  safetyStock: number | null;
  reorderPoint: number | null;
  maxStock: number | null;
  // Colours the on-hand bar for levels already set; left out for levels still being typed
  status?: StockStatus;
  uomSymbol: string;
  // The stock on hand and levels in the item's display unit for levels already set; left out for levels being typed
  display?: SiteStockDisplay;
}

// An item's stock at a site against its stock levels, drawn on the same bar the stock tables show
export const StockLevelsPreview: React.FC<StockLevelsPreviewProps> = (props) => (
  <div className="rounded-lg border bg-muted/30 px-4 pt-3 pb-2">
    <StockLevelBar {...props} />
  </div>
);

interface StockLevelsFormPreviewProps<TForm extends ReplenishmentFormData> {
  // The surrounding form's control; read directly, since the form context comes from quantum-ui's own react-hook-form
  control: Control<TForm>;
  onHand: number;
  uomSymbol: string;
}

// The replenishment being filled into a form, previewed against the stock on hand
export const StockLevelsFormPreview = <TForm extends ReplenishmentFormData>({
  control,
  onHand,
  uomSymbol,
}: StockLevelsFormPreviewProps<TForm>) => {
  const [replenishment, safetyStock, reorderPoint, maxStock] = useWatch({
    // Every form here extends the replenishment fields, and only those are read; Control itself is invariant
    control: control as unknown as Control<ReplenishmentFormData>,
    name: ['replenishment', 'safetyStock', 'reorderPoint', 'maxStock'],
  });
  return (
    <StockLevelsPreview
      onHand={onHand}
      replenishment={replenishment}
      safetyStock={safetyStock}
      reorderPoint={reorderPoint}
      maxStock={maxStock}
      uomSymbol={uomSymbol}
    />
  );
};
