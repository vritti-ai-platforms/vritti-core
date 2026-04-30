import { Button } from '@vritti/quantum-ui/Button';
import { FieldLabel } from '@vritti/quantum-ui/Field';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useState } from 'react';
import type { PriceListItemData } from '@/schemas/price-lists';

interface EditPriceListItemDialogProps {
  item: PriceListItemData;
  isSaving: boolean;
  onSave: (item: PriceListItemData, priceOverride: number | null, isVisible: boolean) => void;
  onCancel: () => void;
}

export const EditPriceListItemDialog: React.FC<EditPriceListItemDialogProps> = ({
  item,
  isSaving,
  onSave,
  onCancel,
}) => {
  const [priceInput, setPriceInput] = useState(item.priceOverride != null ? String(item.priceOverride) : '');
  const [isVisible, setIsVisible] = useState(item.isVisible);

  const handleSave = () => {
    const priceOverride = priceInput.trim() === '' ? null : Number(priceInput);
    onSave(item, priceOverride, isVisible);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Price override</FieldLabel>
          <TextField
            type="number"
            min={0}
            autoFocus
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
            }}
            placeholder={item.basePrice?.toLocaleString() ?? '0'}
          />
        </div>

        <div className="flex items-center justify-between">
          <FieldLabel>Visible</FieldLabel>
          <Switch checked={isVisible} onCheckedChange={setIsVisible} />
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} isLoading={isSaving}>
          Save
        </Button>
      </div>
    </div>
  );
};
