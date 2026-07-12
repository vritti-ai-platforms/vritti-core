import { Button } from '@vritti/quantum-ui/Button';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { Plus, Trash2 } from 'lucide-react';
import type React from 'react';
import type { VariantComponentInput } from '@/schemas/offerings';

interface VariantComponentsFieldProps {
  name?: string;
  value?: VariantComponentInput[];
  onChange?: (value: VariantComponentInput[]) => void;
  onBlur?: () => void;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export const VariantComponentsField: React.FC<VariantComponentsFieldProps> = ({
  value,
  onChange,
  onBlur,
  error,
  label = 'Components',
  disabled,
}) => {
  const rows = value ?? [];

  const emit = (next: VariantComponentInput[]) => {
    onChange?.(next);
    onBlur?.();
  };

  const addRow = () => emit([...rows, { inventoryItemId: '', quantity: 1 }]);

  const removeRow = (index: number) => emit(rows.filter((_, i) => i !== index));

  const setItem = (index: number, option: SelectOption | null) =>
    emit(rows.map((row, i) => (i === index ? { ...row, inventoryItemId: (option?.value as string) ?? '' } : row)));

  const setQuantity = (index: number, quantity: number) =>
    emit(rows.map((row, i) => (i === index ? { ...row, quantity } : row)));

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="subtitle2">{label}</Typography>

      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional with no stable id
        <div key={index} className="flex items-end gap-2">
          <div className="flex-1">
            <InventoryItemSelector
              label={index === 0 ? 'Item' : undefined}
              placeholder="Select item"
              value={row.inventoryItemId || undefined}
              onOptionSelect={(option) => setItem(index, option)}
              disabled={disabled}
            />
          </div>
          <div className="w-24">
            <TextField
              label={index === 0 ? 'Qty' : undefined}
              type="number"
              min={0}
              value={row.quantity}
              onChange={((v: number) => setQuantity(index, Number.isNaN(v) ? 0 : v)) as never}
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => removeRow(index)}
            disabled={disabled}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        startAdornment={<Plus className="size-4" />}
        onClick={addRow}
        disabled={disabled}
        className="self-start"
      >
        Add item
      </Button>

      {error && <Typography className="text-destructive text-sm">{error}</Typography>}
    </div>
  );
};
