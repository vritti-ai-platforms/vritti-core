import { TextField } from '@vritti/quantum-ui/TextField';

// The three stock levels in the order the stock bar draws them; a fragment so <Form> wires each field by name
export function stockLevelFields(uomSymbol: string | null) {
  const unit = uomSymbol ?? undefined;
  return (
    <>
      <TextField
        name="safetyStock"
        label="Safety Stock"
        type="number"
        placeholder="0"
        endAdornment={unit}
        description="Kept back for demand spikes"
      />
      <TextField
        name="reorderPoint"
        label="Reorder Point"
        type="number"
        endAdornment={unit}
        description="Reorder when stock falls to this"
      />
      <TextField
        name="maxStockLevel"
        label="Max Level"
        type="number"
        endAdornment={unit}
        description="The most this site should hold"
      />
    </>
  );
}
