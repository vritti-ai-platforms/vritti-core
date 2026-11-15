import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateInventoryItemLocation } from '@/hooks/site/inventory-items';
import {
  type CreateInventoryItemLocationFormData,
  createInventoryItemLocationSchema,
} from '@/schemas/inventory-item-locations';
import { LocationRoleValues } from '@/schemas/locations';
import { LocationSelector } from '@/selectors/location';

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
    defaultValues: { isBlocked: false },
  });

  const createMutation = useCreateInventoryItemLocation(inventoryItemId, { onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <LocationSelector
        name="locationId"
        label="Location"
        placeholder="Select location"
        params={{ locationRoles: LocationRoleValues.RESERVED_STORAGE }}
      />
      <Switch name="isBlocked" label="Blocked" description="No new stock of this item is put away here" />
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
