import type React from 'react';
import { type Control, useWatch } from 'react-hook-form';
import type { StockStatus } from '@/schemas/inventory-items';
import type { StockLevelsFormData } from '@/schemas/site-stock-levels';
import { StockLevelBar } from './StockLevelBar';

interface StockLevelsPreviewProps {
  // Stock on hand at the site, in the primary unit; 0 while it isn't known (an item still to be picked)
  onHand: number;
  safetyStock: number;
  reorderPoint: number;
  maxStockLevel: number;
  // Colours the on-hand bar for levels already set; left out for levels still being typed
  status?: StockStatus;
  uomSymbol: string | null;
}

// An item's stock at a site against its stock levels, drawn on the same bar the stock tables show
export const StockLevelsPreview: React.FC<StockLevelsPreviewProps> = (props) => (
  <div className="rounded-lg border bg-muted/30 px-4 pt-3 pb-2">
    <StockLevelBar {...props} />
  </div>
);

interface StockLevelsFormPreviewProps<TForm extends StockLevelsFormData> {
  // The surrounding form's control; read directly, since the form context comes from quantum-ui's own react-hook-form
  control: Control<TForm>;
  onHand: number;
  uomSymbol: string | null;
}

// The levels being typed into a stock levels form, previewed against the stock on hand
export const StockLevelsFormPreview = <TForm extends StockLevelsFormData>({
  control,
  onHand,
  uomSymbol,
}: StockLevelsFormPreviewProps<TForm>) => {
  const [safetyStock, reorderPoint, maxStockLevel] = useWatch({
    // Every form here extends the stock levels fields, and only those three are read; Control itself is invariant
    control: control as unknown as Control<StockLevelsFormData>,
    name: ['safetyStock', 'reorderPoint', 'maxStockLevel'],
  });
  return (
    <StockLevelsPreview
      onHand={onHand}
      safetyStock={safetyStock ?? 0}
      reorderPoint={reorderPoint ?? 0}
      maxStockLevel={maxStockLevel ?? 0}
      uomSymbol={uomSymbol}
    />
  );
};
