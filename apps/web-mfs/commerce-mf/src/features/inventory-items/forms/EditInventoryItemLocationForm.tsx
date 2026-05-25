import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateInventoryItemLocation } from '@/hooks/inventory-items';
import {
  type UpdateInventoryItemLocationFormData,
  updateInventoryItemLocationSchema,
} from '@/schemas/inventory-item-locations';

interface EditInventoryItemLocationFormProps {
  inventoryItemId: string;
  locationConfigId: string;
  locationName: string | null;
  currentReorderLevel: number;
  uomSymbol: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditInventoryItemLocationForm: React.FC<EditInventoryItemLocationFormProps> = ({
  inventoryItemId,
  locationConfigId,
  locationName,
  currentReorderLevel,
  uomSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInventoryItemLocationFormData>({
    resolver: zodResolver(updateInventoryItemLocationSchema),
    defaultValues: { reorderLevel: currentReorderLevel },
  });

  const updateMutation = useUpdateInventoryItemLocation(inventoryItemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ locationConfigId, reorderLevel: data.reorderLevel })}
    >
      <p className="text-sm text-muted-foreground">
        Set the minimum stock level for <span className="font-medium text-foreground">{locationName}</span>.
      </p>
      <TextField
        name="reorderLevel"
        label={`Min. Stock Level (${uomSymbol ?? 'units'})`}
        type="number"
        min={0}
        step="any"
      />
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
