import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItem } from '@/hooks/organization/inventory-items';
import type { InventoryItemData } from '@/schemas/inventory-items';
import {
  BASE_MEASURE_SYMBOLS,
  type MeasureFiguresFormData,
  MeasureValues,
  measureFiguresSchema,
  pickMeasureFigures,
} from '@/schemas/measures';

interface EditStorageFiguresFormProps {
  item: InventoryItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStorageFiguresForm: React.FC<EditStorageFiguresFormProps> = ({ item, onSuccess, onCancel }) => {
  const form = useForm<MeasureFiguresFormData>({
    resolver: zodResolver(measureFiguresSchema),
    defaultValues: pickMeasureFigures(item),
  });

  const updateMutation = useUpdateInventoryItem({ onSuccess });

  return (
    <Form form={form} mutation={updateMutation} onCancel={onCancel} transformSubmit={(data) => ({ id: item.id, data })}>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="weight"
          label={`Weight per ${item.uomSymbol}`}
          type="number"
          positive
          placeholder="Not set"
          endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.WEIGHT]}
        />
        <TextField
          name="volume"
          label={`Volume per ${item.uomSymbol}`}
          type="number"
          positive
          placeholder="Not set"
          endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.VOLUME]}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TextField
          name="length"
          label="Length"
          type="number"
          positive
          placeholder="Not set"
          endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
        />
        <TextField
          name="width"
          label="Width"
          type="number"
          positive
          placeholder="Not set"
          endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
        />
        <TextField
          name="height"
          label="Height"
          type="number"
          positive
          placeholder="Not set"
          endAdornment={BASE_MEASURE_SYMBOLS[MeasureValues.LENGTH]}
        />
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
