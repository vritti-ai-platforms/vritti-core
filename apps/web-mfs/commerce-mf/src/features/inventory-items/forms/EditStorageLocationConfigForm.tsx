import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateStorageLocationConfig } from '@/hooks/inventory-items';
import {
  type UpdateStorageLocationConfigFormData,
  updateStorageLocationConfigSchema,
} from '@/schemas/storage-location-configs';

interface EditStorageLocationConfigFormProps {
  itemId: string;
  configId: string;
  locationName: string | null;
  currentReorderLevel: number;
  uomSymbol: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditStorageLocationConfigForm: React.FC<EditStorageLocationConfigFormProps> = ({
  itemId,
  configId,
  locationName,
  currentReorderLevel,
  uomSymbol,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateStorageLocationConfigFormData>({
    resolver: zodResolver(updateStorageLocationConfigSchema),
    defaultValues: { reorderLevel: currentReorderLevel },
  });

  const updateMutation = useUpdateStorageLocationConfig(itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      showRootError
      onCancel={onCancel}
      transformSubmit={(data) => ({ configId, reorderLevel: data.reorderLevel })}
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
