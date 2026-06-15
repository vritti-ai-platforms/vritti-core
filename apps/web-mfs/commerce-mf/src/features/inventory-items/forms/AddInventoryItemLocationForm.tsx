import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInventoryItemLocation } from '@/hooks/inventory-items';
import {
  type CreateInventoryItemLocationFormData,
  createInventoryItemLocationSchema,
} from '@/schemas/inventory-item-locations';
import { LocationRoleValues } from '@/schemas/locations';

interface AddInventoryItemLocationFormProps {
  inventoryItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddInventoryItemLocationForm: React.FC<AddInventoryItemLocationFormProps> = ({
  inventoryItemId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateInventoryItemLocationFormData>({
    resolver: zodResolver(createInventoryItemLocationSchema),
    defaultValues: { locationId: '', reorderLevel: 0 },
  });

  const createMutation = useCreateInventoryItemLocation(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} onCancel={onCancel}>
      <LocationSelector
        name="locationId"
        label="Location"
        placeholder="Select location"
        params={{ locationRoles: LocationRoleValues.RESERVED_STORAGE }}
      />
      <TextField name="reorderLevel" label="Min. Stock Level" type="number" min={0} step="any" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Location
        </Button>
      </DialogActions>
    </Form>
  );
};
