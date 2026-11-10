import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateReorder } from '@/hooks/site/inventory-items';
import { type UpdateReorderFormData, updateReorderSchema } from '@/schemas/inventory-items';

interface EditReorderFormProps {
  inventoryItemId: string;
  currentReorderPoint: number | null;
  uomSymbol: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditReorderForm: React.FC<EditReorderFormProps> = ({
  inventoryItemId,
  currentReorderPoint,
  uomSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateReorderFormData>({
    resolver: zodResolver(updateReorderSchema),
    defaultValues: { reorderPoint: currentReorderPoint ?? 0 },
  });

  const updateMutation = useUpdateReorder({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ inventoryItemId, reorderPoint: data.reorderPoint })}
    >
      <TextField
        name="reorderPoint"
        label={`Reorder Point (${uomSymbol ?? 'units'})`}
        type="number"
        min={0}
        step="any"
      />
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
